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
