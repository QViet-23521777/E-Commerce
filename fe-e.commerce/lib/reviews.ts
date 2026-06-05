import { apiRequest } from "./api";

/**
 * Review replies & moderation. Reviews are embedded in the catalog product and
 * addressed by their stable array `index` (the storefront product payload
 * stamps each visible review with its index). Seller-reply and admin-moderation
 * calls carry the per-portal token via apiRequest.
 */

export interface ReviewReply {
  body: string;
  author: string;
  at: string;
}

export interface SellerReviewRow {
  productId: string;
  productName: string;
  productImage?: string;
  index: number;
  author: string;
  rating: number;
  text: string;
  date: string;
  reply?: ReviewReply | null;
  hidden: boolean;
  reportedCount: number;
}

/** Seller posts a public reply to a review on one of their products. */
export async function replyToReview(
  productId: string,
  index: number,
  body: string,
): Promise<void> {
  await apiRequest(
    `/api/products/${encodeURIComponent(productId)}/reviews/${index}/reply`,
    { method: "POST", body: { body } },
  );
}

/** Buyer flags a review for moderation. */
export async function reportReview(
  productId: string,
  index: number,
): Promise<void> {
  await apiRequest(
    `/api/products/${encodeURIComponent(productId)}/reviews/${index}/report`,
    { method: "POST" },
  );
}

/** Admin hides or unhides a review. */
export async function moderateReview(
  productId: string,
  index: number,
  hidden: boolean,
): Promise<void> {
  await apiRequest(
    `/api/products/${encodeURIComponent(productId)}/reviews/${index}/moderate`,
    { method: "PATCH", body: { hidden } },
  );
}

/** All reviews across the signed-in seller's products. */
export async function fetchSellerReviews(): Promise<SellerReviewRow[]> {
  try {
    const res = await apiRequest<{ success: boolean; data: SellerReviewRow[] }>(
      `/api/products/reviews/seller`,
      { method: "GET" },
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}

/** Reported / hidden reviews across the catalogue (admin moderation queue). */
export async function fetchReportedReviews(): Promise<SellerReviewRow[]> {
  try {
    const res = await apiRequest<{ success: boolean; data: SellerReviewRow[] }>(
      `/api/products/reviews/reported`,
      { method: "GET" },
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}
