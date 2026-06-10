import mongoose, { Schema, Document } from "mongoose";

export interface IUserActivity extends Document {
  userId: string;
  activity: "view" | "search" | "click" | "buy";
  productId?: string;
  keyword?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    activity: {
      type: String,
      enum: ["view", "search", "click", "buy"],
      required: true,
    },
    productId: {
      type: String,
      default: null,
    },
    keyword: {
      type: String,
      default: null,
    },
    categoryId: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

UserActivitySchema.index({ userId: 1, createdAt: -1 });
UserActivitySchema.index({ activity: 1, createdAt: -1 });
UserActivitySchema.index({ productId: 1, activity: 1 });

export const UserActivityModel = mongoose.model<IUserActivity>(
  "UserActivity",
  UserActivitySchema,
);
