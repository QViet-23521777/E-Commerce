import { WalletModel } from "../models/wallet.model";
import { PointsTransactionModel } from "../models/pointsTransaction.model";

// Loyalty economy. Earn 1 point per ₫1,000 spent; redeem each point for ₫10 of
// wallet credit (≈1% cash-back), in blocks of 100 points.
export const POINTS_EARN_PER_VND = 1 / 1000;
export const POINT_VALUE_VND = 10;
export const REDEEM_MIN_POINTS = 100;
export const REDEEM_STEP_POINTS = 100;

export const pointsForAmount = (amount: number): number =>
  Math.floor((Number(amount) || 0) * POINTS_EARN_PER_VND);

export const getOrCreateWallet = async (userId: string) => {
  const wallet = await WalletModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, balance: 0 } },
    { new: true, upsert: true },
  );

  return wallet;
};

export const creditWallet = async (userId: string, amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const wallet = await WalletModel.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true, upsert: true },
  );

  return wallet;
};

export const debitWallet = async (userId: string, amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const wallet = await WalletModel.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true },
  );

  if (!wallet) {
    throw new Error("Insufficient balance");
  }

  return wallet;
};

// ==================== LOYALTY POINTS ====================

// Credit loyalty points (earn) and bump the lifetime total. Records an "earn"
// transaction. Returns the updated wallet.
export const earnPoints = async (
  userId: string,
  points: number,
  orderId?: string,
) => {
  if (!Number.isFinite(points) || points <= 0) {
    return getOrCreateWallet(userId);
  }

  const wallet = await WalletModel.findOneAndUpdate(
    { userId },
    { $inc: { points, lifetimePoints: points } },
    { new: true, upsert: true },
  );

  await PointsTransactionModel.create({
    userId,
    type: "earn",
    points,
    orderId: orderId || null,
    note: orderId ? `Earned from order ${orderId}` : "Points earned",
  });

  return wallet;
};

// Redeem points for wallet credit. Debits points (balance-guarded, leaving
// lifetimePoints intact so the tier sticks) and credits the wallet by
// points * POINT_VALUE_VND. Records a "redeem" transaction.
export const redeemPoints = async (userId: string, points: number) => {
  if (!Number.isInteger(points) || points <= 0) {
    throw new Error("points must be a positive integer");
  }
  if (points < REDEEM_MIN_POINTS) {
    throw new Error(`Minimum redemption is ${REDEEM_MIN_POINTS} points`);
  }
  if (points % REDEEM_STEP_POINTS !== 0) {
    throw new Error(`Points must be redeemed in multiples of ${REDEEM_STEP_POINTS}`);
  }

  const valueVnd = points * POINT_VALUE_VND;

  // Atomically debit points only if the spendable balance covers it.
  const wallet = await WalletModel.findOneAndUpdate(
    { userId, points: { $gte: points } },
    { $inc: { points: -points, balance: valueVnd } },
    { new: true },
  );

  if (!wallet) {
    throw new Error("Insufficient points");
  }

  await PointsTransactionModel.create({
    userId,
    type: "redeem",
    points,
    valueVnd,
    note: `Redeemed ${points} points for ${valueVnd} VND wallet credit`,
  });

  return wallet;
};

export const getPointsHistory = async (userId: string, limit = 20) =>
  PointsTransactionModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100));

