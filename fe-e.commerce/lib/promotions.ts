import { apiRequest } from "./api";

export type DiscountType = "percentage" | "fixed";

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  active: boolean;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerUser?: number | null;
  productIds: string[];
  sellerId?: string | null;
}

export interface PromotionValidation {
  promotion: Promotion;
  orderSubtotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  finalAmount: number;
}

/** Cart line as the promotion service expects it (price is integer VND). */
export interface PromoCartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface DataResponse<T> {
  success: boolean;
  data: T;
}

/** Public — promotions currently running (for the "available offers" list). */
export async function fetchActivePromotions(): Promise<Promotion[]> {
  try {
    const res = await apiRequest<DataResponse<Promotion[]>>(
      "/api/promotions/active",
      { method: "GET" },
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

/** Public — look up a single promotion by its code (no eligibility check). */
export async function lookupPromotionByCode(
  code: string,
): Promise<Promotion | null> {
  try {
    const res = await apiRequest<DataResponse<Promotion>>(
      `/api/promotions/code/${encodeURIComponent(code.trim())}`,
      { method: "GET" },
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Auth required. Validates a code against the cart and returns the computed
 * discount/final amount. Throws `{ status, message }` on rejection (expired,
 * below minimum, usage limit, not applicable, etc.).
 */
export async function validatePromotion(
  code: string,
  items: PromoCartItem[],
): Promise<PromotionValidation> {
  const res = await apiRequest<DataResponse<PromotionValidation>>(
    "/api/promotions/validate",
    { method: "POST", body: { code: code.trim(), items } },
  );
  return res.data;
}

/** Auth required. Same as validate but records a redemption against the user. */
export async function redeemPromotion(
  code: string,
  items: PromoCartItem[],
): Promise<PromotionValidation> {
  const res = await apiRequest<DataResponse<PromotionValidation>>(
    "/api/promotions/redeem",
    { method: "POST", body: { code: code.trim(), items } },
  );
  return res.data;
}

// ─── Seller voucher management (shop hub) ────────────────────────────────────
// These hit the shared promotion CRUD endpoints. The promotion service scopes
// a non-admin caller to their own promotions, so a shop only ever sees/edits
// the vouchers it created.

interface ListResponse<T> {
  success: boolean;
  items: T[];
}

export interface VoucherInput {
  code: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  startDate: string; // ISO
  endDate: string; // ISO
  usageLimit?: number | null;
  productIds?: string[];
}

/** Auth required. Vouchers owned by the current shop. */
export async function fetchMyVouchers(): Promise<Promotion[]> {
  const res = await apiRequest<ListResponse<Promotion>>(
    "/api/promotions?limit=100",
    { method: "GET" },
  );
  return res.items ?? [];
}

/** Auth required. Create a shop voucher. Throws `{ status, message }`. */
export async function createVoucher(input: VoucherInput): Promise<Promotion> {
  const res = await apiRequest<DataResponse<Promotion>>("/api/promotions", {
    method: "POST",
    body: input,
  });
  return res.data;
}

/** Auth required. Update an owned voucher. */
export async function updateVoucher(
  id: string,
  input: Partial<VoucherInput>,
): Promise<Promotion> {
  const res = await apiRequest<DataResponse<Promotion>>(
    `/api/promotions/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  return res.data;
}

/** Auth required. Delete an owned voucher. */
export async function deleteVoucher(id: string): Promise<void> {
  await apiRequest(`/api/promotions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
