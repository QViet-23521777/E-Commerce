import { apiRequest } from "./api";

export interface BackendProduct {
  _id: string;
  name: string;
  normalize?: string;
  description: string;
  price: number;
  sale?: number;
  imageUrl?: string;
  type?: string;
  point?: number;
  numPurchases?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  rating?: number;
  numReviews?: number;
  reviews?: ProductReview[];
}

export interface ProductReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  // Stable array position of this review on the product — used to address it
  // (report / reply / moderate). Present on the storefront product payload.
  index?: number;
  // Seller's public response, when present.
  reply?: { body: string; author: string; at: string } | null;
}

export interface UIProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  category?: string;
  description?: string;
  type?: string;
  point?: number;
  numPurchases?: number;
  salePercent?: number;
  rating?: number;
  numReviews?: number;
  reviews?: ProductReview[];
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80";

export function toUIProduct(p: BackendProduct): UIProduct {
  const salePct = Number(p.sale ?? 0);
  const original = Number(p.price ?? 0);
  const discounted =
    salePct > 0 ? Math.round(original * (1 - salePct / 100)) : original;
  return {
    id: String(p._id),
    name: p.name,
    price: discounted,
    originalPrice: salePct > 0 ? original : undefined,
    image: p.imageUrl?.trim() ? p.imageUrl : FALLBACK_IMG,
    category: p.type,
    description: p.description,
    type: p.type,
    point: p.point,
    numPurchases: p.numPurchases,
    salePercent: salePct,
    rating: p.rating,
    numReviews: p.numReviews,
    reviews: p.reviews,
    tag:
      salePct >= 30
        ? "Sale"
        : (p.numPurchases ?? 0) >= 2000
          ? "Hot"
          : undefined,
  };
}

type Cursor = Record<string, unknown> | null;

interface PaginatedResponse {
  success: boolean;
  items: BackendProduct[];
  nextCusor?: Cursor;
  nextCursor?: Cursor;
}

interface ListTypeResponse {
  success: boolean;
  listItems: BackendProduct[];
  nextCursor?: Cursor;
}

interface SingleResponse {
  success: boolean;
  data: BackendProduct;
}

export async function fetchTopPurchases(limit = 10): Promise<UIProduct[]> {
  const res = await apiRequest<PaginatedResponse>(
    `/api/products/top/purchases?limit=${limit}`,
  );
  return (res.items ?? []).map(toUIProduct);
}

export async function fetchTopSale(limit = 10): Promise<UIProduct[]> {
  const res = await apiRequest<PaginatedResponse>(
    `/api/products/top/sale?limit=${limit}`,
  );
  return (res.items ?? []).map(toUIProduct);
}

export async function fetchTopPoint(limit = 10): Promise<UIProduct[]> {
  const res = await apiRequest<PaginatedResponse>(
    `/api/products/top/point?limit=${limit}`,
  );
  return (res.items ?? []).map(toUIProduct);
}

export async function fetchTopByType(
  type: string,
  limit = 10,
): Promise<UIProduct[]> {
  const res = await apiRequest<PaginatedResponse>(
    `/api/products/top/type/${encodeURIComponent(type)}?limit=${limit}`,
  );
  return (res.items ?? []).map(toUIProduct);
}

export async function fetchTopByListType(
  types: string[],
  limit = 4,
): Promise<UIProduct[]> {
  if (!types.length) return [];
  // Gateway strips queries on /top/list-type — fan-out instead.
  const settled = await Promise.allSettled(
    types.map((t) => fetchTopByType(t, limit)),
  );
  const out: UIProduct[] = [];
  for (const r of settled) if (r.status === "fulfilled") out.push(...r.value);
  return out;
}

export interface SearchResult {
  items: UIProduct[];
  nextCursor: { lastTrack?: number; lastId?: string } | null;
}

export async function searchProducts(
  q: string,
  limit = 12,
  cursor?: { lastTrack?: number; lastId?: string } | null,
): Promise<SearchResult> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (cursor?.lastId) params.set("lastId", cursor.lastId);
  if (cursor?.lastTrack !== undefined)
    params.set("lastTrack", String(cursor.lastTrack));
  const res = await apiRequest<PaginatedResponse>(
    `/api/products/search?${params.toString()}`,
  );
  return {
    items: (res.items ?? []).map(toUIProduct),
    nextCursor:
      (res.nextCursor as { lastTrack?: number; lastId?: string } | null) ??
      null,
  };
}

// ── Storefront faceted search (filters + sort + pagination) ──────────────────

export interface AdvancedSearchParams {
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  page?: number;
  limit?: number;
}

export interface AdvancedSearchResult {
  items: UIProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdvancedSearchResponse {
  success: boolean;
  items: BackendProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchProductsAdvanced(
  params: AdvancedSearchParams,
): Promise<AdvancedSearchResult> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.type) sp.set("type", params.type);
  if (params.minPrice !== undefined) sp.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) sp.set("maxPrice", String(params.maxPrice));
  if (params.minRating !== undefined) sp.set("minRating", String(params.minRating));
  if (params.inStock) sp.set("inStock", "true");
  if (params.onSale) sp.set("onSale", "true");
  if (params.sort) sp.set("sort", params.sort);
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 12));

  const res = await apiRequest<AdvancedSearchResponse>(
    `/api/products/search?${sp.toString()}`,
  );
  return {
    items: (res.items ?? []).map(toUIProduct),
    total: res.total ?? 0,
    page: res.page ?? 1,
    limit: res.limit ?? 12,
    totalPages: res.totalPages ?? 1,
  };
}

export async function fetchProductById(id: string): Promise<UIProduct | null> {
  try {
    const res = await apiRequest<SingleResponse>(
      `/api/products/${encodeURIComponent(id)}`,
    );
    return res.data ? toUIProduct(res.data) : null;
  } catch {
    return null;
  }
}

export interface InventoryHit {
  _id: string;
  name: string;
  quantity: number;
  productId?: string;
  sellerId?: string;
}

export async function fetchInventoryByName(
  name: string,
): Promise<InventoryHit[]> {
  try {
    const res = await apiRequest<
      | { success: boolean; data: InventoryHit[] | InventoryHit }
      | { success: boolean; items: InventoryHit[] }
    >(`/api/inventory/search?name=${encodeURIComponent(name)}`);
    if ("data" in res && res.data) {
      return Array.isArray(res.data) ? res.data : [res.data];
    }
    if ("items" in res && Array.isArray(res.items)) return res.items;
    return [];
  } catch {
    return [];
  }
}

export interface ShopOfProduct {
  sellerId: string;
  inventoryId?: string;
  productCount: number;
  unitsSold: number;
}

export async function fetchShopByProduct(
  productId: string,
): Promise<ShopOfProduct | null> {
  try {
    const res = await apiRequest<{ success: boolean; data: ShopOfProduct }>(
      `/api/inventory/product/${encodeURIComponent(productId)}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Submit a review for a catalog product. The backend appends it to the
 * product's embedded `reviews[]` and recomputes the aggregate rating.
 */
export async function submitProductReview(
  productId: string,
  review: { rating: number; text?: string; author?: string },
): Promise<{ rating: number; numReviews: number }> {
  const res = await apiRequest<{
    success: boolean;
    data: { rating: number; numReviews: number };
  }>(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: review,
  });
  return res.data;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
