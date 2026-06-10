import { apiRequest } from "./api";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletResponse {
  success: boolean;
  data: Wallet;
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

/** Top up the wallet by a positive integer amount (Vietnamese Dong). */
export async function creditWallet(amount: number): Promise<Wallet> {
  const res = await apiRequest<WalletResponse>("/api/wallets/credit", {
    method: "POST",
    body: { amount },
  });
  return res.data;
}
