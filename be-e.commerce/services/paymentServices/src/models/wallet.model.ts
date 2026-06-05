import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: string;
  balance: number;
  // Spendable loyalty-point balance (decreases on redeem).
  points: number;
  // Total points ever earned — never decreases on redeem, so it drives the
  // loyalty tier (spending points must not demote the buyer).
  lifetimePoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    points: { type: Number, required: true, default: 0, min: 0 },
    lifetimePoints: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const WalletModel =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

