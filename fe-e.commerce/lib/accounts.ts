import { apiRequest } from "./api";

// Roles as stored by the user service. "user" is a buyer in the UI.
export type AccountRole = "user" | "seller" | "admin" | "superadmin";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await apiRequest<{ success: boolean; data: Account[] }>(
    `/api/admin/users`,
  );
  return res.data ?? [];
}

// Suspend (ban) or reactivate (unban) an account. Admins/superadmins are rejected
// by the backend guard, so the UI only offers this for buyers and sellers.
export async function setAccountActive(
  userId: string,
  active: boolean,
): Promise<void> {
  await apiRequest(`/api/admin/${active ? "unban-user" : "ban-user"}`, {
    method: "POST",
    body: { userId },
  });
}
