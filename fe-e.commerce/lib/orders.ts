import { apiRequest } from "./api";
import type {
  FulfillmentStatus,
  Payment,
  PaymentItem,
  PaymentStatus,
  ShippingAddress,
} from "./payments";

export type { FulfillmentStatus, PaymentStatus, ShippingAddress };

/**
 * An order is the enriched `Payment` record (the backend has no separate Order
 * model). Buyer endpoints return the full order; the seller endpoint projects
 * `items` down to that seller's lines and adds `sellerSubtotal`.
 */
export type OrderItem = PaymentItem;

export interface Order extends Payment {
  fulfillmentStatus: FulfillmentStatus;
  /** Present only on seller-scoped responses (sum of the seller's own lines). */
  sellerSubtotal?: number;
}

export type FulfillmentAction = "confirm" | "ship" | "deliver";

interface DataResponse<T> {
  success: boolean;
  data: T;
}

/** Buyer: my orders, newest first. Optional fulfilment-status filter. */
export async function fetchMyOrders(
  status?: FulfillmentStatus,
): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest<DataResponse<Order[]>>(`/api/payments${qs}`, {
    method: "GET",
  });
  return res.data ?? [];
}

/** Buyer: a single order by its orderId. Returns null if not found. */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  try {
    const res = await apiRequest<DataResponse<Order>>(
      `/api/payments/${encodeURIComponent(orderId)}`,
      { method: "GET" },
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Seller: paid orders containing my items (items projected to mine). */
export async function fetchSellerOrders(
  status?: FulfillmentStatus,
): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest<DataResponse<Order[]>>(
    `/api/payments/seller${qs}`,
    { method: "GET" },
  );
  return res.data ?? [];
}

/** Seller: advance fulfilment (confirm → ship → deliver). */
export async function advanceOrderFulfillment(
  orderId: string,
  action: FulfillmentAction,
  trackingNo?: string,
): Promise<Order> {
  const res = await apiRequest<DataResponse<Order>>(
    `/api/payments/${encodeURIComponent(orderId)}/fulfillment`,
    { method: "PATCH", body: { action, trackingNo } },
  );
  return res.data;
}

/** Buyer or seller: cancel an order (restores stock + refunds wallet). */
export async function cancelOrder(orderId: string): Promise<Order> {
  const res = await apiRequest<DataResponse<Order>>(
    `/api/payments/${encodeURIComponent(orderId)}/cancel`,
    { method: "POST" },
  );
  return res.data;
}

// ── Display helpers ──────────────────────────────────────────────────────────

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  to_confirm: "To Confirm",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Whether an order can still be cancelled (early in the lifecycle). */
export function isCancellable(order: Pick<Order, "fulfillmentStatus">): boolean {
  return (
    order.fulfillmentStatus === "to_confirm" ||
    order.fulfillmentStatus === "processing"
  );
}
