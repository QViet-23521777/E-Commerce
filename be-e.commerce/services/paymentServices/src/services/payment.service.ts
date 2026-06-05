import crypto from "crypto";
import { IPayment, PaymentModel } from "../models/payment.model";
import {
  createMomoPayment,
  getMomoPartnerCode,
  verifyMomoIpnSignature,
} from "./momo.service";
import { creditWallet, debitWallet, earnPoints, pointsForAmount } from "./wallet.service";

type CreatePaymentItemInput = {
  productId: string;
  quantity: number;
};

type ShippingAddressInput = {
  fullName?: string;
  phone?: string;
  line1?: string;
  city?: string;
  zip?: string;
};

type CreatePaymentInput = {
  amount?: number;
  orderInfo?: string;
  redirectUrl?: string;
  extraData?: string;
  lang?: string;
  items?: CreatePaymentItemInput[];
  shippingAddress?: ShippingAddressInput;
  shippingMethod?: string;
};

type ProductSnapshot = {
  _id: string;
  name: string;
  quantity: number;
  sellerId?: string;
  productId: {
    _id?: string;
    price: number;
    name: string;
    imageUrl?: string;
  };
};

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";

const ACTIVITY_SERVICE_URL =
  process.env.ACTIVITY_SERVICE_URL || "http://localhost:3004";

const createOrderId = (): string => crypto.randomUUID();
const createRequestId = (): string => crypto.randomUUID();

const recordBuyActivities = async (
  userId: string,
  items: { productId: string; quantity: number }[],
) => {
  try {
    await Promise.all(
      items.map((item) =>
        fetch(`${ACTIVITY_SERVICE_URL}/api/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            activity: "buy",
            productId: item.productId,
          }),
        }),
      ),
    );
    console.log("[recordBuyActivities] recorded", {
      userId,
      count: items.length,
    });
  } catch (err) {
    // Không throw — activity là non-critical
    console.warn("[recordBuyActivities] failed, skipping", err);
  }
};

const fetchInventory = async (productId: string): Promise<ProductSnapshot> => {
  const response = await fetch(
    `${PRODUCT_SERVICE_URL.replace(/\/$/, "")}/api/inventory/${productId}`,
  );

  const data = (await response.json()) as {
    success?: boolean;
    data?: ProductSnapshot;
    message?: string;
  };

  console.log("[fetchInventory]", {
    status: response.status,
    ok: response.ok,
    success: data.success,
    message: data.message,
    hasData: !!data.data,
  });

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || `Unable to fetch product ${productId}`);
  }

  return data.data;
};

const buyInventoryByList = async (
  items: { inventoryId: string; quantity: number }[],
) => {
  console.log(
    "[buyInventoryByList] url:",
    `${PRODUCT_SERVICE_URL}/api/inventory/buy/batch`,
  );
  console.log("[buyInventoryByList] items:", JSON.stringify(items, null, 2));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${PRODUCT_SERVICE_URL}/api/inventory/buy/batch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal: controller.signal,
      },
    );

    const data = (await response.json()) as { message?: string };

    console.log("[buyInventoryByList] response:", {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      throw new Error(data.message || "Failed to buy inventory");
    }

    return data;
  } catch (error) {
    console.log("[buyInventoryByList] error:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const restoreInventoryByList = async (
  items: { inventoryId: string; quantity: number }[],
) => {
  const response = await fetch(
    `${PRODUCT_SERVICE_URL}/api/inventory/restore/batch`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to restore inventory");
  }

  return response.json();
};

const resolveItemsAndAmount = async (payload: CreatePaymentInput) => {
  console.log(
    "[resolveItemsAndAmount] payload:",
    JSON.stringify(payload, null, 2),
  );

  if (!payload.items || payload.items.length === 0) {
    if (payload.amount === undefined) {
      throw new Error("amount is required when items are not provided");
    }
    return { amount: Number(payload.amount), items: [] };
  }

  const inventory = await Promise.all(
    payload.items.map((item) => fetchInventory(item.productId)),
  );

  const items = payload.items.map((item, index) => {
    const goods = inventory[index];
    const unitPrice = Number(goods.productId.price);
    const totalPrice = unitPrice * item.quantity;

    console.log(`[resolveItemsAndAmount] item[${index}]`, {
      goods,
      unitPrice,
      totalPrice,
    });

    return {
      productId: goods._id,
      name: goods.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      sellerId: goods.sellerId ? String(goods.sellerId) : null,
      image: goods.productId?.imageUrl ?? null,
      catalogProductId: goods.productId?._id
        ? String(goods.productId._id)
        : null,
    };
  });

  const computed = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // The charged amount can legitimately differ from the bare item subtotal:
  // shipping and coupon discounts live in the storefront, not in inventory, so
  // the backend can't recompute them. Trust the caller's `amount` as the charge
  // when provided, while still keeping the resolved line items for seller
  // attribution + stock deduction. Fall back to the item subtotal otherwise.
  // (This lets a real, fully-priced order also be seller-attributed instead of
  // forcing an amount-only checkout that records no items.)
  const amount = payload.amount !== undefined ? Number(payload.amount) : computed;

  console.log("[resolveItemsAndAmount] amount:", {
    charged: amount,
    itemSubtotal: computed,
  });

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
  partnerCode: payment.partnerCode,
  amount: payment.amount,
  status: payment.status,
  fulfillmentStatus: payment.fulfillmentStatus,
  orderInfo: payment.orderInfo,
  shippingAddress: payment.shippingAddress,
  shippingMethod: payment.shippingMethod,
  trackingNo: payment.trackingNo,
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
  cancelledAt: payment.cancelledAt,
  refundedAt: payment.refundedAt,
});

// Normalize an order for a specific seller — project only that seller's items
// and compute a per-seller subtotal so a multi-seller order surfaces only the
// relevant lines to each shop.
const normalizeSellerOrder = (payment: any, sellerId: string) => {
  const base = normalizePaymentResponse(payment);
  const sellerItems = (payment.items || []).filter(
    (i: { sellerId?: string }) => String(i.sellerId) === String(sellerId),
  );
  const sellerSubtotal = sellerItems.reduce(
    (sum: number, i: { totalPrice: number }) => sum + (i.totalPrice || 0),
    0,
  );
  return { ...base, items: sellerItems, sellerSubtotal };
};

// ==================== MOMO ====================

export const createMomoPaymentSession = async (
  userId: string,
  payload: CreatePaymentInput & { walletId?: string },
) => {
  console.log("[createMomoPaymentSession] start", { userId, payload });

  const orderId = createOrderId();
  const requestId = createRequestId();
  const orderInfo =
    payload.orderInfo?.trim() || "Thanh toan don hang MiniSupermarket";
  const redirectUrl =
    payload.redirectUrl?.trim() ||
    process.env.MOMO_REDIRECT_URL ||
    "http://localhost:3001";
  const ipnUrl =
    process.env.MOMO_IPN_URL || "http://localhost:3000/api/payments/momo/ipn";
  const lang = payload.lang || process.env.MOMO_LANG || "vi";
  const requestType = process.env.MOMO_REQUEST_TYPE || "captureWallet";
  const autoCapture = process.env.MOMO_AUTO_CAPTURE !== "false";

  const { amount, items } = await resolveItemsAndAmount(payload);
  console.log("[createMomoPaymentSession] resolvedItems", { amount, items });

  // Tạo payment record, chưa trừ tồn kho — sẽ trừ khi IPN confirm paid
  console.log("[createMomoPaymentSession] creating payment record...");
  const payment = await PaymentModel.create({
    userId,
    walletId: payload.walletId || null,
    partnerCode: getMomoPartnerCode(),
    requestId,
    orderId,
    amount,
    requestType,
    orderInfo,
    status: "pending",
    fulfillmentStatus: "to_confirm",
    shippingAddress: payload.shippingAddress || null,
    shippingMethod: payload.shippingMethod || null,
    redirectUrl,
    ipnUrl,
    extraData: "",
    items,
  });
  console.log("[createMomoPaymentSession] payment record created", {
    paymentId: payment._id,
  });

  const extraData = buildExtraData(
    payment._id.toString(),
    userId,
    payload.extraData,
  );
  payment.extraData = extraData;

  try {
    console.log("[createMomoPaymentSession] calling MoMo API...");

    let momoResponse: Awaited<ReturnType<typeof createMomoPayment>>;

    if (process.env.MOMO_MOCK === "true") {
      console.log("[createMomoPaymentSession] MOCK mode");
      momoResponse = {
        resultCode: 0,
        message: "Thành công",
        payUrl: `https://test-payment.momo.vn/mock?orderId=${orderId}`,
        deeplink: `momo://mock?orderId=${orderId}`,
        qrCodeUrl: `https://test-payment.momo.vn/mock/qr?orderId=${orderId}`,
      };
    } else {
      momoResponse = await createMomoPayment({
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
    }

    console.log("[createMomoPaymentSession] MoMo response", momoResponse);

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
      typeof momoResponse.qrCodeUrl === "string"
        ? momoResponse.qrCodeUrl
        : null;
    payment.resultCode =
      typeof momoResponse.resultCode === "number"
        ? momoResponse.resultCode
        : null;
    payment.message =
      typeof momoResponse.message === "string" ? momoResponse.message : null;

    if (payment.resultCode !== null && payment.resultCode !== 0) {
      console.log("[createMomoPaymentSession] MoMo rejected", {
        resultCode: payment.resultCode,
      });
      payment.status = "failed";
      payment.failedAt = new Date();
    } else {
      console.log("[createMomoPaymentSession] MoMo accepted, waiting for IPN", {
        payUrl: payment.payUrl,
      });
    }

    await payment.save();
  } catch (error) {
    console.log("[createMomoPaymentSession] error", error);
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

  // In mock mode there is no real MoMo to produce an HMAC signature, so the
  // sandbox/return flow confirms the order by posting a synthetic IPN. Skip the
  // signature check there; the orderId + amount + partnerCode checks below still
  // guard against confirming an unrelated or tampered order.
  if (process.env.MOMO_MOCK !== "true" && !verifyMomoIpnSignature(payload)) {
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
    typeof payload.transId === "number"
      ? payload.transId
      : Number(payload.transId);

  if (payment.resultCode === 0) {
    // Flow mua hàng trực tiếp → trừ tồn kho + ghi activity
    if (payment.items.length > 0) {
      await buyInventoryByList(
        payment.items.map((item: { productId: string; quantity: number }) => ({
          inventoryId: item.productId,
          quantity: item.quantity,
        })),
      );
      await recordBuyActivities(payment.userId, payment.items);
    }

    // Flow nạp ví → cộng số dư
    if (payment.walletId && payment.items.length === 0) {
      await creditWallet(payment.userId, payment.amount);
    }

    // Award loyalty points for purchases (not wallet top-ups). Idempotent: a
    // re-fired IPN sees pointsAwarded already set and skips.
    if (payment.items.length > 0 && !payment.pointsAwarded) {
      const earned = pointsForAmount(payment.amount);
      if (earned > 0) {
        await earnPoints(payment.userId, earned, payment.orderId);
        payment.pointsAwarded = earned;
      }
    }

    payment.status = "paid";
    payment.fulfillmentStatus = "to_confirm";
    payment.paidAt = new Date();
    payment.failedAt = null;
  } else {
    // Thất bại → không cần restore vì chưa trừ tồn kho
    payment.status = "failed";
    payment.failedAt = new Date();
  }

  await payment.save();

  return payment;
};

// ==================== WALLET CHECKOUT ====================

export const checkoutWithWallet = async (
  userId: string,
  payload: CreatePaymentInput,
) => {
  console.log("[checkoutWithWallet] start", { userId, payload });

  const orderId = createOrderId();
  const orderInfo =
    payload.orderInfo?.trim() || "Thanh toan don hang MiniSupermarket";

  const { amount, items } = await resolveItemsAndAmount(payload);
  console.log("[checkoutWithWallet] resolvedItems", { amount, items });

  // Trừ ví trước — nếu không đủ tiền thì dừng ngay
  console.log("[checkoutWithWallet] debiting wallet...");
  await debitWallet(userId, amount);
  console.log("[checkoutWithWallet] wallet debited");

  // Trừ tồn kho — chỉ khi có items cụ thể. Thanh toán theo `amount` (giỏ hàng
  // chưa gắn inventoryId thật) thì bỏ qua, giống nhánh IPN của MoMo.
  if (items.length > 0) {
    console.log("[checkoutWithWallet] buying inventory...");
    try {
      await buyInventoryByList(
        items.map((item) => ({
          inventoryId: item.productId,
          quantity: item.quantity,
        })),
      );
      console.log("[checkoutWithWallet] inventory bought");
      await recordBuyActivities(userId, items);
    } catch (error) {
      // Tồn kho thất bại → hoàn tiền lại ví
      console.log("[checkoutWithWallet] inventory failed, refunding wallet...");
      await creditWallet(userId, amount);
      throw error;
    }
  } else {
    console.log("[checkoutWithWallet] amount-only checkout, skipping inventory");
  }

  // Tạo payment record đã paid
  const payment = await PaymentModel.create({
    userId,
    walletId: null,
    partnerCode: "WALLET",
    requestId: orderId,
    orderId,
    amount,
    requestType: "wallet",
    orderInfo,
    status: "paid",
    fulfillmentStatus: "to_confirm",
    shippingAddress: payload.shippingAddress || null,
    shippingMethod: payload.shippingMethod || null,
    // schema marks these required (empty string fails validation); wallet
    // payments have no MoMo redirect/ipn, so use a sentinel.
    redirectUrl: "wallet",
    ipnUrl: "wallet",
    extraData: "",
    items,
    resultCode: 0,
    message: "Thanh toán bằng ví thành công",
    paidAt: new Date(),
  });

  console.log("[checkoutWithWallet] payment record created", {
    paymentId: payment._id,
  });

  // Award loyalty points for the purchase. A wallet checkout is always a real
  // purchase (never a top-up), so award on the order amount.
  const earned = pointsForAmount(amount);
  if (earned > 0) {
    await earnPoints(userId, earned, orderId);
    payment.pointsAwarded = earned;
    await payment.save();
  }

  return normalizePaymentResponse(payment);
};

// ==================== COMMON ====================

export const getPaymentForUser = async (orderId: string, userId: string) => {
  const payment = await PaymentModel.findOne({ orderId, userId });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return normalizePaymentResponse(payment);
};

// ==================== ORDERS (buyer + seller) ====================

type ListOrdersOptions = {
  status?: string;
  limit?: number;
};

const FULFILLMENT_FLOW: Record<string, string> = {
  confirm: "processing",
  ship: "shipped",
  deliver: "delivered",
};

const REQUIRED_PRIOR_STATUS: Record<string, string> = {
  confirm: "to_confirm",
  ship: "processing",
  deliver: "shipped",
};

export const listOrdersForBuyer = async (
  userId: string,
  options: ListOrdersOptions = {},
) => {
  const { status, limit = 20 } = options;
  const query: Record<string, unknown> = { userId };
  if (status) query.fulfillmentStatus = status;

  const payments = await PaymentModel.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100));

  return payments.map(normalizePaymentResponse);
};

export const listOrdersForSeller = async (
  sellerId: string,
  options: ListOrdersOptions = {},
) => {
  const { status } = options;
  const query: Record<string, unknown> = {
    "items.sellerId": sellerId,
    status: "paid",
  };
  if (status) query.fulfillmentStatus = status;

  const payments = await PaymentModel.find(query).sort({ createdAt: -1 });

  return payments.map((p) => normalizeSellerOrder(p, sellerId));
};

export const getSellerOrderById = async (
  orderId: string,
  sellerId: string,
) => {
  const payment = await PaymentModel.findOne({ orderId });
  if (!payment) {
    throw new Error("Payment not found");
  }

  const ownsItem = (payment.items || []).some(
    (i: { sellerId?: string }) => String(i.sellerId) === String(sellerId),
  );
  if (!ownsItem) {
    throw new Error("Payment not found");
  }

  return normalizeSellerOrder(payment, sellerId);
};

export const advanceFulfillment = async (
  orderId: string,
  sellerId: string,
  action: "confirm" | "ship" | "deliver",
  trackingNo?: string,
) => {
  const nextStatus = FULFILLMENT_FLOW[action];
  if (!nextStatus) {
    throw new Error("Invalid fulfillment action");
  }

  const payment = await PaymentModel.findOne({ orderId });
  if (!payment) {
    throw new Error("Payment not found");
  }

  const ownsItem = (payment.items || []).some(
    (i: { sellerId?: string }) => String(i.sellerId) === String(sellerId),
  );
  if (!ownsItem) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "paid") {
    throw new Error("Order is not paid");
  }

  if (payment.fulfillmentStatus === "cancelled") {
    throw new Error("Order is cancelled");
  }

  if (payment.fulfillmentStatus !== REQUIRED_PRIOR_STATUS[action]) {
    throw new Error(
      `Cannot ${action} an order in status "${payment.fulfillmentStatus}"`,
    );
  }

  payment.fulfillmentStatus = nextStatus as IPayment["fulfillmentStatus"];
  if (action === "ship" && trackingNo) {
    payment.trackingNo = trackingNo;
  }

  await payment.save();
  return normalizeSellerOrder(payment, sellerId);
};

export const cancelOrder = async (orderId: string, actorId: string) => {
  const payment = await PaymentModel.findOne({ orderId });
  if (!payment) {
    throw new Error("Payment not found");
  }

  const isBuyer = String(payment.userId) === String(actorId);
  const isSeller = (payment.items || []).some(
    (i: { sellerId?: string }) => String(i.sellerId) === String(actorId),
  );
  if (!isBuyer && !isSeller) {
    throw new Error("Payment not found");
  }

  // Idempotent — a second cancel is a no-op.
  if (payment.fulfillmentStatus === "cancelled") {
    return normalizePaymentResponse(payment);
  }

  if (!["to_confirm", "processing"].includes(payment.fulfillmentStatus)) {
    throw new Error(
      `Cannot cancel an order that is already "${payment.fulfillmentStatus}"`,
    );
  }

  // Refund + restore only for a paid wallet order. MoMo refunds are out of scope.
  if (payment.status === "paid" && payment.partnerCode === "WALLET") {
    if (payment.items && payment.items.length > 0) {
      await restoreInventoryByList(
        payment.items.map((item: { productId: string; quantity: number }) => ({
          inventoryId: item.productId,
          quantity: item.quantity,
        })),
      );
    }
    await creditWallet(payment.userId, payment.amount);
    payment.refundedAt = new Date();
  }
  // TODO MoMo refund — out of scope for v1 (only wallet refunds are automated).

  payment.fulfillmentStatus = "cancelled";
  payment.cancelledAt = new Date();
  await payment.save();

  return normalizePaymentResponse(payment);
};
