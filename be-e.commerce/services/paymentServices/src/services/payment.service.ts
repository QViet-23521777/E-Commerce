import crypto from "crypto";
import { PaymentModel } from "../models/payment.model";
import {
  createMomoPayment,
  getPaymentMethodById,
  getPaymentMethodByRequestType,
  getMomoPartnerCode,
  PAYMENT_METHODS,
  queryMomoPayment,
  refundMomoPayment,
  verifyMomoIpnSignature,
  type MomoPaymentMethod,
  type MomoRequestType,
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
  paymentMethod?: MomoPaymentMethod;
  requestType?: MomoRequestType;
  items?: CreatePaymentItemInput[];
};

type PaymentHistoryInput = {
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
};

type RefundPaymentInput = {
  amount?: number;
  description?: string;
  lang?: string;
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

const resolvePaymentMethod = (payload: CreatePaymentInput) => {
  const configuredRequestType =
    payload.requestType || process.env.MOMO_REQUEST_TYPE || "captureWallet";

  const method = payload.paymentMethod
    ? getPaymentMethodById(payload.paymentMethod)
    : getPaymentMethodByRequestType(configuredRequestType);

  if (!method) {
    throw new Error(
      `Unsupported payment method. Use one of: ${PAYMENT_METHODS.map(
        (item) => item.id,
      ).join(", ")}`,
    );
  }

  if (payload.requestType && payload.requestType !== method.requestType) {
    throw new Error(
      `paymentMethod ${method.id} must use requestType ${method.requestType}`,
    );
  }

  return method;
};

const applyMomoStatus = (
  payment: any,
  resultCode: number | null,
  message?: string | null,
) => {
  payment.resultCode = resultCode;
  payment.message = message ?? payment.message ?? null;

  if (resultCode === 0) {
    if (["refunded", "partially_refunded"].includes(payment.status)) return;

    payment.status = "paid";
    payment.paidAt = payment.paidAt ?? new Date();
    payment.failedAt = null;
    return;
  }

  if (resultCode !== null && resultCode !== 1000 && payment.status === "pending") {
    payment.status = "failed";
    payment.failedAt = new Date();
  }
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
  currency: payment.currency,
  status: payment.status,
  requestType: payment.requestType,
  paymentMethod: payment.paymentMethod,
  orderInfo: payment.orderInfo,
  refundedAmount: payment.refundedAmount,
  refundableAmount: Math.max(0, payment.amount - (payment.refundedAmount ?? 0)),
  payUrl: payment.payUrl,
  deeplink: payment.deeplink,
  qrCodeUrl: payment.qrCodeUrl,
  resultCode: payment.resultCode,
  message: payment.message,
  transId: payment.transId,
  items: payment.items,
  refunds: payment.refunds,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  paidAt: payment.paidAt,
  failedAt: payment.failedAt,
});

export const getMomoPaymentMethods = () => {
  return PAYMENT_METHODS;
};

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
  const autoCapture = process.env.MOMO_AUTO_CAPTURE !== "false";
  const method = resolvePaymentMethod(payload);
  const requestType = method.requestType;

  const { amount, items } = await resolveItemsAndAmount(payload);

  if (amount < method.minimumAmount) {
    throw new Error(
      `${method.label} requires a minimum amount of ${method.minimumAmount} VND`,
    );
  }

  const payment = await PaymentModel.create({
    userId,
    partnerCode: getMomoPartnerCode(),
    requestId,
    orderId,
    amount,
    requestType,
    paymentMethod: method.id,
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

    if (payment.resultCode !== 0) applyMomoStatus(payment, payment.resultCode, payment.message);

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
  payment.transId =
    typeof payload.transId === "number" ? payload.transId : Number(payload.transId);

  applyMomoStatus(payment, Number(payload.resultCode), String(payload.message || ""));

  await payment.save();

  return payment;
};

export const getPaymentHistoryForUser = async (
  userId: string,
  filters: PaymentHistoryInput,
) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const query: Record<string, unknown> = { userId };

  if (filters.status) query.status = filters.status;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;

  const [payments, total] = await Promise.all([
    PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PaymentModel.countDocuments(query),
  ]);

  return {
    items: payments.map(normalizePaymentResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const syncPaymentWithMomo = async (orderId: string, userId: string) => {
  const payment = await PaymentModel.findOne({ orderId, userId });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const response = await queryMomoPayment({
    requestId: createRequestId(),
    orderId: payment.orderId,
    lang: process.env.MOMO_LANG || "vi",
  });

  payment.queryResponse = response;
  payment.resultCode =
    typeof response.resultCode === "number" ? response.resultCode : payment.resultCode;
  payment.message =
    typeof response.message === "string" ? response.message : payment.message;
  payment.transId =
    typeof response.transId === "number" ? response.transId : payment.transId;

  if (typeof response.resultCode === "number") {
    applyMomoStatus(payment, response.resultCode, response.message);
  }

  await payment.save();

  return normalizePaymentResponse(payment);
};

export const refundPaymentForUser = async (
  orderId: string,
  userId: string,
  payload: RefundPaymentInput,
) => {
  const payment = await PaymentModel.findOne({ orderId, userId });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (!["paid", "partially_refunded"].includes(payment.status)) {
    throw new Error("Only paid payments can be refunded");
  }

  if (!payment.transId) {
    throw new Error("Payment does not have a MoMo transaction id yet");
  }

  const remainingAmount = payment.amount - (payment.refundedAmount ?? 0);
  const refundAmount = payload.amount ?? remainingAmount;

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    throw new Error("Refund amount must be a positive number");
  }

  if (refundAmount > remainingAmount) {
    throw new Error("Refund amount is greater than remaining refundable amount");
  }

  const method = getPaymentMethodByRequestType(payment.requestType);
  const minimumRefundAmount = method?.id === "atm" ? 10000 : 1000;

  if (refundAmount < minimumRefundAmount) {
    throw new Error(`Minimum refund amount is ${minimumRefundAmount} VND`);
  }

  const requestId = createRequestId();
  const refundOrderId = createOrderId();
  const description = payload.description?.trim() || `Refund ${payment.orderId}`;
  const response = await refundMomoPayment({
    requestId,
    orderId: refundOrderId,
    amount: refundAmount,
    transId: payment.transId,
    description,
    lang: payload.lang || process.env.MOMO_LANG || "vi",
  });

  payment.refunds.push({
    requestId,
    orderId: refundOrderId,
    amount: refundAmount,
    description,
    resultCode:
      typeof response.resultCode === "number" ? response.resultCode : null,
    message: typeof response.message === "string" ? response.message : null,
    transId: typeof response.transId === "number" ? response.transId : null,
    response,
    createdAt: new Date(),
  });

  if (response.resultCode === 0) {
    payment.refundedAmount = (payment.refundedAmount ?? 0) + refundAmount;
    payment.status =
      payment.refundedAmount >= payment.amount ? "refunded" : "partially_refunded";
  }

  await payment.save();

  return normalizePaymentResponse(payment);
};

export const getPaymentForUser = async (orderId: string, userId: string) => {
  const payment = await PaymentModel.findOne({ orderId, userId });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return normalizePaymentResponse(payment);
};
