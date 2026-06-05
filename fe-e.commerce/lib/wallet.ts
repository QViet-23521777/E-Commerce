import { apiRequest } from "./api";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  points: number;
  lifetimePoints: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletResponse {
  success: boolean;
  data: Wallet;
}

export type PointsTxnType = "earn" | "redeem";

export interface PointsTransaction {
  id: string;
  type: PointsTxnType;
  points: number;
  valueVnd: number | null;
  orderId: string | null;
  note: string;
  createdAt: string;
}

export interface PointsSummary {
  points: number;
  lifetimePoints: number;
  tier: string;
  pointValueVnd: number;
  minRedeem: number;
  redeemStep: number;
  history: PointsTransaction[];
}

interface PointsResponse {
  success: boolean;
  data: PointsSummary;
}

/**
 * Fetch the current user's wallet. The backend upserts on read, so this also
 * doubles as "create wallet" — a brand-new account gets a zero-balance wallet.
 */
export async function fetchWallet(): Promise<Wallet> {
  // No trailing slash — the gateway 404s on `/api/wallets/`.
  const res = await apiRequest<WalletResponse>("/api/wallets", { method: "GET" });
  return res.data;
}

/**
 * Admin-only: top up another user's wallet by a positive integer amount
 * (Vietnamese Dong). Buyers can no longer self-credit — top-ups are performed
 * from the admin portal. Gated behind the admin guard at the gateway.
 */
export async function adminCreditWallet(
  userId: string,
  amount: number,
): Promise<Wallet> {
  const res = await apiRequest<WalletResponse>("/api/admin/wallets/credit", {
    method: "POST",
    body: { userId, amount },
  });
  return res.data;
}

/**
 * Fetch the caller's loyalty-points summary: spendable balance, lifetime total,
 * tier, redemption rules, and recent points history.
 */
export async function fetchPoints(): Promise<PointsSummary> {
  const res = await apiRequest<PointsResponse>("/api/wallets/points", {
    method: "GET",
  });
  return res.data;
}

/**
 * Redeem loyalty points for wallet credit (each point = `pointValueVnd`).
 * Throws `{ status: 402 }` when the caller lacks enough points. Returns the
 * updated wallet (higher balance, lower points).
 */
export async function redeemPoints(points: number): Promise<Wallet> {
  const res = await apiRequest<WalletResponse>("/api/wallets/points/redeem", {
    method: "POST",
    body: { points },
  });
  return res.data;
}

/**
 * Withdraw (debit) a positive integer amount from the wallet. Throws
 * `{ status: 402 }` when the balance is insufficient.
 */
export async function withdrawWallet(amount: number): Promise<Wallet> {
  const res = await apiRequest<WalletResponse>("/api/wallets/withdraw", {
    method: "POST",
    body: { amount },
  });
  return res.data;
}
