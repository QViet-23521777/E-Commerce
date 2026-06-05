import { apiRequest } from "./api";
import { getUser } from "./auth";

export interface ActivityRecord {
  _id?: string;
  userId: string;
  activity: "view" | "search" | "click" | "buy";
  productId?: string | null;
  keyword?: string | null;
  categoryId?: string | null;
  createdAt?: string;
}

interface HistoryResponse {
  success: boolean;
  data: ActivityRecord[];
}

/**
 * Record a browse/search/buy signal for the signed-in user. Events are queued
 * server-side (activityServices) and only surface in the recommendation feeds
 * once flushed, so this also flushes immediately — the rails on the homepage /
 * product page read straight from the flushed history. Fire-and-forget: any
 * failure is swallowed so tracking never blocks the UI. No-op for guests.
 */
export async function trackActivity(
  activity: "view" | "search" | "click" | "buy",
  opts: { productId?: string; keyword?: string } = {},
): Promise<void> {
  const user = getUser();
  if (!user?.userId) return;
  try {
    await apiRequest(`/api/activities`, {
      method: "POST",
      body: {
        userId: user.userId,
        activity,
        ...(opts.productId ? { productId: opts.productId } : {}),
        ...(opts.keyword ? { keyword: opts.keyword } : {}),
      },
    });
    await flushActivities(user.userId);
  } catch {
    /* non-critical */
  }
}

/** Flush the user's queued activity so it lands in the recommendation history. */
export async function flushActivities(userId: string): Promise<void> {
  try {
    await apiRequest(`/api/activities/flush/${encodeURIComponent(userId)}`, {
      method: "POST",
    });
  } catch {
    /* non-critical */
  }
}

/** Fetch a user's browse/search/purchase history (most recent first). */
export async function fetchActivityHistory(
  userId: string,
  limit = 20,
): Promise<ActivityRecord[]> {
  try {
    const res = await apiRequest<HistoryResponse>(
      `/api/activities/history/${encodeURIComponent(userId)}?limit=${limit}`,
      { method: "GET" },
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}
