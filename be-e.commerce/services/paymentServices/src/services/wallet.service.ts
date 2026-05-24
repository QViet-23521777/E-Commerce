import { WalletModel } from "../models/wallet.model";

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

