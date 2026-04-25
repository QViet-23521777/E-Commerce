import mongoose, { Document, Schema } from "mongoose";

export type DiscountType = "percentage" | "fixed";

export interface IPromotionRedemption {
  userId: string;
  count: number;
  lastRedeemedAt: Date;
}

export interface IPromotion extends Document {
  code: string;
  title: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: Date;
  endDate: Date;
  active: boolean;
  usageLimit?: number | null;
  usedCount: number;
  usageLimitPerUser?: number | null;
  productIds: string[];
  redemptions: IPromotionRedemption[];
  createdAt: Date;
  updatedAt: Date;
}

const PromotionRedemptionSchema = new Schema<IPromotionRedemption>(
  {
    userId: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    lastRedeemedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const PromotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    usageLimitPerUser: { type: Number, default: null },
    productIds: { type: [String], default: [] },
    redemptions: { type: [PromotionRedemptionSchema], default: [] },
  },
  { timestamps: true },
);

PromotionSchema.index({ active: 1, startDate: 1, endDate: 1 });

export const PromotionModel =
  mongoose.models.Promotion ||
  mongoose.model<IPromotion>("Promotion", PromotionSchema);
