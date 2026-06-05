import { apiRequest } from "./api";

// ── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  label: string;
  slug: string;
  iconName: string;
  productType: string;
  order: number;
}

interface ListResponse<T> {
  success: boolean;
  data: T;
}

/** Public: all managed categories (storefront + admin read this). */
export async function fetchCategories(): Promise<Category[]> {
  const res = await apiRequest<ListResponse<Category[]>>(
    "/api/support/categories",
    { method: "GET" },
  );
  return res.data ?? [];
}

export async function createCategory(input: {
  label: string;
  iconName?: string;
  productType?: string;
  order?: number;
}): Promise<Category> {
  const res = await apiRequest<ListResponse<Category>>(
    "/api/support/categories",
    { method: "POST", body: input },
  );
  return res.data;
}

export async function updateCategory(
  id: string,
  patch: { label?: string; iconName?: string; productType?: string; order?: number },
): Promise<Category> {
  const res = await apiRequest<ListResponse<Category>>(
    `/api/support/categories/${encodeURIComponent(id)}`,
    { method: "PATCH", body: patch },
  );
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/api/support/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackStatus = "open" | "resolved";

export interface Feedback {
  id: string;
  author: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: FeedbackStatus;
  urgent: boolean;
  reply: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Any authenticated user: submit feedback / a support request. */
export async function submitFeedback(input: {
  subject: string;
  message: string;
  rating?: number;
  author?: string;
  email?: string;
}): Promise<Feedback> {
  const res = await apiRequest<ListResponse<Feedback>>("/api/support/feedback", {
    method: "POST",
    body: input,
  });
  return res.data;
}

/** Admin: list feedback, optionally filtered by status. */
export async function fetchFeedback(
  status?: FeedbackStatus,
): Promise<Feedback[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await apiRequest<ListResponse<Feedback[]>>(
    `/api/support/feedback${qs}`,
    { method: "GET" },
  );
  return res.data ?? [];
}

/** Admin: resolve/reopen and/or reply to a feedback entry. */
export async function updateFeedback(
  id: string,
  patch: { status?: FeedbackStatus; reply?: string },
): Promise<Feedback> {
  const res = await apiRequest<ListResponse<Feedback>>(
    `/api/support/feedback/${encodeURIComponent(id)}`,
    { method: "PATCH", body: patch },
  );
  return res.data;
}

// ── Seller bank profile ──────────────────────────────────────────────────────

export interface SellerBank {
  sellerId: string;
  bankName: string;
  accountNo: string;
  updatedAt?: string;
}

export async function fetchSellerBank(): Promise<SellerBank> {
  const res = await apiRequest<ListResponse<SellerBank>>(
    "/api/support/seller/bank",
    { method: "GET" },
  );
  return res.data;
}

export async function saveSellerBank(input: {
  bankName: string;
  accountNo: string;
}): Promise<SellerBank> {
  const res = await apiRequest<ListResponse<SellerBank>>(
    "/api/support/seller/bank",
    { method: "PUT", body: input },
  );
  return res.data;
}
