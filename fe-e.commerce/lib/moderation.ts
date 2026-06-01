import { apiRequest } from "./api";
import type { BackendProduct } from "./products";

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface ModerationProduct extends BackendProduct {
  sellerId?: string | null;
}

export async function fetchModerationProducts(
  status: ModerationStatus = "pending",
  limit = 50,
): Promise<ModerationProduct[]> {
  const res = await apiRequest<{ success: boolean; data: ModerationProduct[] }>(
    `/api/admin/products/moderation?status=${status}&limit=${limit}`,
  );
  return res.data ?? [];
}

export async function setProductModeration(
  productId: string,
  status: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  await apiRequest(
    `/api/admin/products/${encodeURIComponent(productId)}/status`,
    { method: "PATCH", body: { status, reason } },
  );
}
