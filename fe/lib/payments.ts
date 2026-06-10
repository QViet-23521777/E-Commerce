import { apiRequest } from "./api";

export type PaymentStatus = "pending" | "paid" | "failed";

export type FulfillmentStatus =
  | "to_confirm"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface PaymentItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sellerId?: string | null;
  image?: string | null;
  catalogProductId?: string | null;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  city?: string;
  zip?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  requestId: string;
  userId: string;
  partnerCode?: string;
  amount: number;
  status: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  orderInfo: string;
  shippingAddress?: ShippingAddress | null;
  shippingMethod?: string | null;
  trackingNo?: string | null;
  payUrl?: string | null;
  deeplink?: string | null;
  qrCodeUrl?: string | null;
  resultCode?: number | null;
  message?: string | null;
  transId?: number | null;
  items: PaymentItem[];
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
}

interface DataResponse<T> {
  success: boolean;
  data: T;
}

export interface CheckoutItemInput {
  productId: string; // this is the inventory _id
  quantity: number;
}

export interface CheckoutInput {
  // Integer VND. Optional: when `items` are provided the backend recomputes the
  // amount from inventory prices (and rejects a mismatching `amount`), so callers
  // should omit it in that case and send it only for amount-only checkouts.
  amount?: number;
  orderInfo?: string;
  items?: CheckoutItemInput[];
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
}

/**
 * Pay from the user's wallet. Debits the balance and returns a `paid` payment
 * immediately (throws `{ status: 402 }` on insufficient balance). When `items`
 * (carrying inventory IDs) are sent, stock is deducted and the order is
 * seller-attributed; otherwise it falls back to an amount-only checkout.
 */
export async function walletCheckout(input: CheckoutInput): Promise<Payment> {
  const res = await apiRequest<DataResponse<Payment>>(
    "/api/payments/wallet/checkout",
    { method: "POST", body: input },
  );
  return res.data;
}

/** Create a MoMo payment session. Returns a `pending` payment with a payUrl. */
export async function createMomoPayment(input: CheckoutInput): Promise<Payment> {
  const res = await apiRequest<DataResponse<Payment>>(
    "/api/payments/momo/create",
    { method: "POST", body: input },
  );
  return res.data;
}

/** Fetch the live status of a payment by its orderId. */
export async function getPaymentStatus(orderId: string): Promise<Payment | null> {
  try {
    const res = await apiRequest<DataResponse<Payment>>(
      `/api/payments/${encodeURIComponent(orderId)}`,
      { method: "GET" },
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
