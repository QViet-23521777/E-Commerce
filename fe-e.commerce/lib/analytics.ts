import type { Order } from "./orders";

// Pure helpers that derive Seller Finance / Dashboard figures from the seller's
// real orders (GET /api/payments/seller). The seller endpoint projects each
// order's items to the seller's own lines and adds `sellerSubtotal`, so revenue
// is simply the sum of that across paid orders. Amounts are integer VND.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Per-order revenue contribution for this seller. */
const orderRevenue = (o: Order): number =>
  typeof o.sellerSubtotal === "number" ? o.sellerSubtotal : o.amount ?? 0;

const orderDate = (o: Order): Date =>
  new Date(o.paidAt || o.createdAt || Date.now());

const isCancelled = (o: Order): boolean =>
  o.fulfillmentStatus === "cancelled" || !!o.cancelledAt;

/** Revenue per month for the trailing 6 months (cancelled orders excluded). */
export function monthlyRevenue(orders: Order[]): { month: string; value: number }[] {
  const now = new Date();
  const buckets: { month: string; value: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: MONTHS[d.getMonth()], value: 0, key: `${d.getFullYear()}-${d.getMonth()}` });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of orders) {
    if (isCancelled(o)) continue;
    const d = orderDate(o);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const i = index.get(key);
    if (i !== undefined) buckets[i].value += orderRevenue(o);
  }
  return buckets.map(({ month, value }) => ({ month, value }));
}

export interface RevenueSummary {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  momChangePct: number | null;
  /** Revenue from paid orders not yet delivered (and not cancelled). */
  pendingClearance: number;
  orderCount: number;
}

export function revenueSummary(orders: Order[]): RevenueSummary {
  const now = new Date();
  const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = `${lastDate.getFullYear()}-${lastDate.getMonth()}`;

  let totalRevenue = 0;
  let thisMonth = 0;
  let lastMonth = 0;
  let pendingClearance = 0;
  let orderCount = 0;

  for (const o of orders) {
    if (isCancelled(o)) continue;
    const rev = orderRevenue(o);
    totalRevenue += rev;
    orderCount += 1;
    const d = orderDate(o);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key === thisKey) thisMonth += rev;
    if (key === lastKey) lastMonth += rev;
    if (o.fulfillmentStatus !== "delivered") pendingClearance += rev;
  }

  const momChangePct =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return { totalRevenue, thisMonth, lastMonth, momChangePct, pendingClearance, orderCount };
}

export type TransactionType = "payout" | "refund";

export interface DerivedTransaction {
  id: string;
  type: TransactionType;
  label: string;
  amount: number; // positive = inflow, negative = outflow
  date: string;
  status: "completed" | "pending";
}

/** Turn orders into a transaction feed: a payout per paid order, a refund per
 *  cancelled-and-refunded order. Newest first. */
export function ordersToTransactions(orders: Order[]): DerivedTransaction[] {
  const txns: DerivedTransaction[] = [];
  for (const o of orders) {
    const short = `#${String(o.orderId).slice(0, 8)}`;
    if (isCancelled(o)) {
      if (o.refundedAt) {
        txns.push({
          id: `${o.orderId}-refund`,
          type: "refund",
          label: `Refund issued · ${short}`,
          amount: -orderRevenue(o),
          date: o.cancelledAt || o.refundedAt || o.createdAt || "",
          status: "completed",
        });
      }
      continue;
    }
    txns.push({
      id: `${o.orderId}-payout`,
      type: "payout",
      label: `Order payout · ${short}`,
      amount: orderRevenue(o),
      date: o.paidAt || o.createdAt || "",
      status: o.fulfillmentStatus === "delivered" ? "completed" : "pending",
    });
  }
  return txns.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/** Short human date for the transaction feed. */
export function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
