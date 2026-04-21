import crypto from "crypto";
import { PaymentModel } from "../models/payment.model";
import {
  createMomoPayment,
  getMomoPartnerCode,
  verifyMomoIpnSignature,
} from "./momo.service";

type CreatePaymentItemInput = {
  productId: string;
  quantity: number;
};

type CreatePaymentInput = {
  amount?: number;
  orderInfo?: string;
  redirectUrl?: string;
  extraData?: string;
  lang?: string;
  items?: CreatePaymentItemInput[];
};

type ProductSnapshot = {
  _id: string;
  name: string;
  price: number;
};

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";

const createOrderId = (): string => crypto.randomUUID();
const createRequestId = (): string => crypto.randomUUID();

const fetchProduct = async (productId: string): Promise<ProductSnapshot> => {
  const response = await fetch(
    `${PRODUCT_SERVICE_URL.replace(/\/$/, "")}/api/products/${productId}`,
  );

  const data = (await response.json()) as {
    success?: boolean;
    data?: ProductSnapshot;
    message?: string;
  };

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || `Unable to fetch product ${productId}`);
  }

  return data.data;
};

const resolveItemsAndAmount = async (payload: CreatePaymentInput) => {
  if (!payload.items || payload.items.length === 0) {
    if (payload.amount === undefined) {
      throw new Error("amount is required when items are not provided");
    }

    return {
      amount: Number(payload.amount),
      items: [],
    };
  }

  const products = await Promise.all(
    payload.items.map((item) => fetchProduct(item.productId)),
  );

  const items = payload.items.map((item, index) => {
    const product = products[index];
    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * item.quantity;

    return {
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const amount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (payload.amount !== undefined && Number(payload.amount) !== amount) {
    throw new Error(
      `Provided amount ${payload.amount} does not match computed amount ${amount}`,
    );
  }

  return { amount, items };
};

const buildExtraData = (
  paymentId: string,
  userId: string,
  extraData?: string,
): string => {
  return Buffer.from(
    JSON.stringify({
      paymentId,
      userId,
      extraData: extraData || null,
    }),
  ).toString("base64");
};

const normalizePaymentResponse = (payment: any) => ({
  id: payment._id,
  orderId: payment.orderId,
  requestId: payment.requestId,
  userId: payment.userId,
  amount: payment.amount,
  status: payment.status,
  orderInfo: payment.orderInfo,
  payUrl: payment.payUrl,
  deeplink: payment.deeplink,
  qrCodeUrl: payment.qrCodeUrl,
  resultCode: payment.resultCode,
  message: payment.message,
  transId: payment.transId,
  items: payment.items,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  paidAt: payment.paidAt,
  failedAt: payment.failedAt,
});

export const createMomoPaymentSession = async (
  userId: string,
  payload: CreatePaymentInput,
) => {
  const orderId = createOrderId();
  const requestId = createRequestId();
  const orderInfo = payload.orderInfo?.trim() || "Thanh toan don hang MiniSupermarket";
  const redirectUrl =
    payload.redirectUrl?.trim() || process.env.MOMO_REDIRECT_URL || "http://localhost:3001";
  const ipnUrl =
    process.env.MOMO_IPN_URL || "http://localhost:3000/api/payments/momo/ipn";
  const lang = payload.lang || process.env.MOMO_LANG || "vi";
  const requestType = process.env.MOMO_REQUEST_TYPE || "captureWallet";
  const autoCapture = process.env.MOMO_AUTO_CAPTURE !== "false";

  const { amount, items } = await resolveItemsAndAmount(payload);

  const payment = await PaymentModel.create({
    userId,
    partnerCode: getMomoPartnerCode(),
    requestId,
    orderId,
    amount,
    requestType,
    orderInfo,
    status: "pending",
    redirectUrl,
    ipnUrl,
    extraData: "",
    items,
  });

  const extraData = buildExtraData(payment._id.toString(), userId, payload.extraData);

  payment.extraData = extraData;

  try {
    const momoResponse = await createMomoPayment({
      requestId,
      orderId,
      amount,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      lang,
      requestType,
      autoCapture,
    });

    payment.createPayload = {
      requestId,
      orderId,
      amount,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      lang,
      requestType,
      autoCapture,
    };
    payment.createResponse = momoResponse;
    payment.payUrl =
      typeof momoResponse.payUrl === "string" ? momoResponse.payUrl : null;
    payment.deeplink =
      typeof momoResponse.deeplink === "string" ? momoResponse.deeplink : null;
    payment.qrCodeUrl =
      typeof momoResponse.qrCodeUrl === "string" ? momoResponse.qrCodeUrl : null;
    payment.resultCode =
      typeof momoResponse.resultCode === "number" ? momoResponse.resultCode : null;
    payment.message =
      typeof momoResponse.message === "string" ? momoResponse.message : null;

    if (payment.resultCode !== null && payment.resultCode !== 0) {
      payment.status = "failed";
      payment.failedAt = new Date();
    }

    await payment.save();
  } catch (error) {
    payment.status = "failed";
    payment.message =
      error instanceof Error ? error.message : "Failed to create MoMo payment";
    payment.failedAt = new Date();
    await payment.save();
    throw error;
  }

  return normalizePaymentResponse(payment);
};

export const processMomoIpn = async (payload: any) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid IPN payload");
  }

  if (!verifyMomoIpnSignature(payload)) {
    throw new Error("Invalid MoMo IPN signature");
  }

  const payment = await PaymentModel.findOne({ orderId: payload.orderId });
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payload.partnerCode !== payment.partnerCode) {
    throw new Error("Partner code mismatch");
  }

  if (Number(payload.amount) !== payment.amount) {
    throw new Error("Payment amount mismatch");
  }

  payment.ipnPayload = payload;
  payment.resultCode = Number(payload.resultCode);
  payment.message = String(payload.message || "");
  payment.transId =
    typeof payload.transId === "number" ? payload.transId : Number(payload.transId);

  if (payment.resultCode === 0) {
    payment.status = "paid";
    payment.paidAt = new Date();
    payment.failedAt = null;
  } else {
    payment.status = "failed";
    payment.failedAt = new Date();
  }

  await payment.save();

  return payment;
};

export const getPaymentForUser = async (orderId: string, userId: string) => {
  const payment = await PaymentModel.findOne({ orderId, userId });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return normalizePaymentResponse(payment);
};
