import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const WalletModel =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);

