import { apiRequest } from "./api";
import { fetchProductById, fetchTopByType, type UIProduct } from "./products";

/**
 * Recommendation helpers. These ride entirely on data the activity pipeline
 * already collects (view / buy events in activityServices) plus the existing
 * product feeds — no new storage. Each helper resolves to hydrated UIProducts
 * ready to drop into a ProductCard rail, and degrades to an empty list on any
 * error so a missing rail never breaks the page.
 */

interface RecentActivity {
  activity: "view" | "search" | "buy" | "click";
  productId?: string;
  keyword?: string;
}

interface RecentResponse {
  success: boolean;
  data?: {
    views?: RecentActivity[];
    searches?: RecentActivity[];
    purchases?: RecentActivity[];
    clicks?: RecentActivity[];
  };
}

interface IdListResponse {
  success: boolean;
  data?: string[];
}

/** De-dupe ids preserving first-seen order. */
function uniq(ids: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Resolve a list of product ids to UIProducts, dropping any that 404. */
async function hydrate(ids: string[]): Promise<UIProduct[]> {
  if (ids.length === 0) return [];
  const settled = await Promise.all(ids.map((id) => fetchProductById(id)));
  return settled.filter((p): p is UIProduct => p !== null);
}

async function fetchRecent(userId: string): Promise<RecentResponse["data"]> {
  try {
    const res = await apiRequest<RecentResponse>(
      `/api/activities/recent/${encodeURIComponent(userId)}`,
      { method: "GET" },
    );
    return res.data ?? {};
  } catch {
    return {};
  }
}

/** Most recently viewed products (newest first, de-duplicated). */
export async function fetchRecentlyViewed(
  userId: string,
  limit = 8,
): Promise<UIProduct[]> {
  const data = await fetchRecent(userId);
  const ids = uniq((data?.views ?? []).map((v) => v.productId)).slice(0, limit);
  return hydrate(ids);
}

/**
 * "Recommended for you" — derived from the categories the user has recently
 * viewed or bought: pull the top products in those categories, drop anything
 * they've already purchased. Falls back to an empty list (the homepage's
 * existing "Just for You" still covers cold-start users).
 */
export async function fetchRecommendedForYou(
  userId: string,
  limit = 10,
): Promise<UIProduct[]> {
  const data = await fetchRecent(userId);
  const viewedIds = uniq((data?.views ?? []).map((v) => v.productId)).slice(0, 8);
  const purchasedIds = uniq((data?.purchases ?? []).map((p) => p.productId));
  if (viewedIds.length === 0 && purchasedIds.length === 0) return [];

  // Hydrate signal products to learn which categories the user engages with.
  const signalProducts = await hydrate(uniq([...viewedIds, ...purchasedIds]));
  const types = uniq(signalProducts.map((p) => p.type)).slice(0, 3);
  if (types.length === 0) return [];

  const lists = await Promise.all(types.map((t) => fetchTopByType(t, limit)));
  const exclude = new Set(purchasedIds);
  const merged: UIProduct[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const p of list) {
      if (exclude.has(p.id) || seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged.slice(0, limit);
}

/** "Customers who bought this also bought …" for a product detail page. */
export async function fetchAlsoBought(
  productId: string,
  limit = 8,
): Promise<UIProduct[]> {
  try {
    const res = await apiRequest<IdListResponse>(
      `/api/activities/also-bought/${encodeURIComponent(productId)}?limit=${limit}`,
      { method: "GET" },
    );
    return hydrate((res.data ?? []).slice(0, limit));
  } catch {
    return [];
  }
}
