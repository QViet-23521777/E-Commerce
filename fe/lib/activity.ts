import { apiRequest } from "./api";

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

export async function postActivity(data: {
  userId: string;
  activity: "view" | "click" | "buy" | "search";
  productId?: string;
  keyword?: string;
}): Promise<void> {
  try {
    await apiRequest("/api/activities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch { /* không block UI */ }
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
