import mongoose, { Document, Schema } from "mongoose";

export type PointsTransactionType = "earn" | "redeem";

export interface IPointsTransaction extends Document {
  userId: string;
  type: PointsTransactionType;
  // Points moved by this transaction (always positive; `type` gives direction).
  points: number;
  // For redemptions, the wallet credit (VND) the points converted into.
  valueVnd?: number | null;
  // For earnings, the order the points came from.
  orderId?: string | null;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["earn", "redeem"], required: true },
    points: { type: Number, required: true },
    valueVnd: { type: Number, default: null },
    orderId: { type: String, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

PointsTransactionSchema.index({ userId: 1, createdAt: -1 });

export const PointsTransactionModel =
  mongoose.models.PointsTransaction ||
  mongoose.model<IPointsTransaction>(
    "PointsTransaction",
    PointsTransactionSchema,
  );
