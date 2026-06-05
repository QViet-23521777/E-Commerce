import { apiRequest } from "./api";

interface DataResponse<T> {
  success: boolean;
  data: T;
}

export interface AdminUserStats {
  totalUsers: number;
  monthlySignups: { month: string; value: number }[];
}

export interface ProductStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** Admin: user count + 6-month signup trend (from the user service). */
export async function fetchAdminUserStats(): Promise<AdminUserStats> {
  const res = await apiRequest<DataResponse<AdminUserStats>>(
    "/api/admin/stats",
    { method: "GET" },
  );
  return res.data;
}

/** Admin: catalog counts by moderation status (from the inventory service). */
export async function fetchProductStats(): Promise<ProductStats> {
  const res = await apiRequest<DataResponse<ProductStats>>(
    "/api/admin/products/stats",
    { method: "GET" },
  );
  return res.data;
}
