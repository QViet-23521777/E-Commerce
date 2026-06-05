import mongoose, { Schema, Document } from "mongoose";

// A seller's payout bank profile (one per seller). Used by the Seller Finance
// page; the actual money movement on "withdraw" happens against the wallet
// service — this only stores where payouts would be sent.
export interface ISellerBank extends Document {
  sellerId: string;
  bankName: string;
  accountNo: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SellerBankSchema = new Schema<ISellerBank>(
  {
    sellerId: { type: String, required: true, unique: true, index: true },
    bankName: { type: String, default: "" },
    accountNo: { type: String, default: "" },
  },
  { timestamps: true },
);

export const SellerBank = mongoose.model<ISellerBank>(
  "SellerBank",
  SellerBankSchema,
);
