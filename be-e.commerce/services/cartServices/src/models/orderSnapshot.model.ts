import mongoose, { Schema, Document } from "mongoose";
import { ICartItem } from "./cart.model";

// A snapshot of a completed order's line items, stashed so the confirmation /
// order-detail pages can render the basket (the payment record itself only
// stores an amount). Keyed by (userId, orderId) so it follows the account
// across devices. Note: this is arguably a payment/order concern, but it's
// kept here to keep the cart→checkout→snapshot flow self-contained.
export interface IOrderSnapshot extends Document {
  userId: string;
  orderId: string;
  items: ICartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  method: "wallet" | "momo";
  createdAt?: Date;
  updatedAt?: Date;
}

const SnapshotItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    qty: { type: Number, default: 1 },
    variant: { type: String },
    inventoryId: { type: String },
    sellerId: { type: String },
  },
  { _id: false },
);

const OrderSnapshotSchema = new Schema<IOrderSnapshot>(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    items: { type: [SnapshotItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    total: { type: Number, default: 0 },
    method: { type: String, enum: ["wallet", "momo"], default: "wallet" },
  },
  { timestamps: true },
);

// One snapshot per (user, order).
OrderSnapshotSchema.index({ userId: 1, orderId: 1 }, { unique: true });

export const OrderSnapshot = mongoose.model<IOrderSnapshot>(
  "OrderSnapshot",
  OrderSnapshotSchema,
);
