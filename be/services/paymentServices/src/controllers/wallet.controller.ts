import { Context } from "hono";
import { creditWallet, getOrCreateWallet } from "../services/wallet.service";

const normalizeWallet = (wallet: any) => ({
  id: wallet._id,
  userId: wallet.userId,
  balance: wallet.balance,
  createdAt: wallet.createdAt,
  updatedAt: wallet.updatedAt,
});

export const getMyWalletController = async (c: Context) => {
  const user = c.get("user") as { id: string };
  const wallet = await getOrCreateWallet(user.id);
  return c.json({ success: true, data: normalizeWallet(wallet) });
};

export const creditMyWalletController = async (c: Context) => {
  const user = c.get("user") as { id: string };
  const body = c.get("validatedBody") as { amount: number };
  const wallet = await creditWallet(user.id, Number(body.amount));
  return c.json({ success: true, data: normalizeWallet(wallet) }, 201);
};

