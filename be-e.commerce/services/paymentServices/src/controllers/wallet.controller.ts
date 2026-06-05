import { Context } from "hono";
import {
  creditWallet,
  debitWallet,
  getOrCreateWallet,
  getPointsHistory,
  redeemPoints,
  POINT_VALUE_VND,
  REDEEM_MIN_POINTS,
  REDEEM_STEP_POINTS,
} from "../services/wallet.service";

const normalizeWallet = (wallet: any) => ({
  id: wallet._id,
  userId: wallet.userId,
  balance: wallet.balance,
  points: wallet.points ?? 0,
  lifetimePoints: wallet.lifetimePoints ?? 0,
  createdAt: wallet.createdAt,
  updatedAt: wallet.updatedAt,
});

// Loyalty tier from lifetime points earned (spending never demotes).
const loyaltyTier = (lifetimePoints: number): string => {
  if (lifetimePoints >= 5000) return "Elite Status";
  if (lifetimePoints >= 1000) return "Gold Status";
  if (lifetimePoints >= 100) return "Silver Status";
  return "Member";
};

const normalizePointsTxn = (t: any) => ({
  id: t._id,
  type: t.type,
  points: t.points,
  valueVnd: t.valueVnd ?? null,
  orderId: t.orderId ?? null,
  note: t.note ?? "",
  createdAt: t.createdAt,
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

// Admin-only top-up: credits a *target* user's wallet (userId in the body)
// instead of the caller's own. The gateway gates this behind the admin guard;
// the buyer-facing self top-up has been removed in favour of this flow.
export const adminCreditWalletController = async (c: Context) => {
  const body = c.get("validatedBody") as { userId?: string; amount: number };
  if (!body.userId || String(body.userId).trim() === "") {
    return c.json({ success: false, message: "userId is required" }, 400);
  }
  const wallet = await creditWallet(String(body.userId), Number(body.amount));
  return c.json({ success: true, data: normalizeWallet(wallet) }, 201);
};

// Loyalty points summary for the caller: spendable balance, lifetime total,
// tier, the redemption rules, and recent points history.
export const getMyPointsController = async (c: Context) => {
  const user = c.get("user") as { id: string };
  const wallet = await getOrCreateWallet(user.id);
  const history = await getPointsHistory(user.id, 20);
  return c.json({
    success: true,
    data: {
      points: wallet.points ?? 0,
      lifetimePoints: wallet.lifetimePoints ?? 0,
      tier: loyaltyTier(wallet.lifetimePoints ?? 0),
      pointValueVnd: POINT_VALUE_VND,
      minRedeem: REDEEM_MIN_POINTS,
      redeemStep: REDEEM_STEP_POINTS,
      history: history.map(normalizePointsTxn),
    },
  });
};

// Redeem points for wallet credit. Returns the updated wallet (with the higher
// balance and lower points). 402 when the caller lacks enough points.
export const redeemPointsController = async (c: Context) => {
  const user = c.get("user") as { id: string };
  const body = c.get("validatedBody") as { points: number };
  try {
    const wallet = await redeemPoints(user.id, Number(body.points));
    return c.json({ success: true, data: normalizeWallet(wallet) }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to redeem points";
    const status = message === "Insufficient points" ? 402 : 400;
    return c.json({ success: false, message }, status);
  }
};

// Withdraw (debit) from the caller's wallet — used by the Seller Finance page.
// Reuses the same balance-guarded debit as checkout, so an over-withdrawal
// returns 402 instead of going negative.
export const withdrawMyWalletController = async (c: Context) => {
  const user = c.get("user") as { id: string };
  const body = c.get("validatedBody") as { amount: number };
  try {
    const wallet = await debitWallet(user.id, Number(body.amount));
    return c.json({ success: true, data: normalizeWallet(wallet) }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to withdraw";
    const status = message === "Insufficient balance" ? 402 : 400;
    return c.json({ success: false, message }, status);
  }
};

