import mongoose, { Schema, Document } from "mongoose";

// One cart document per user. The cart is stored as a whole blob — the frontend
// is the source of truth for structure and re-sends the full item list on every
// mutation (PUT), so the server stays a simple persistence layer. Item shape
// mirrors the frontend `CartItem` 1:1.
export interface ICartItem {
  productId: string;
  name: string;
  image: string;
  price: number; // VND, integer
  qty: number;
  variant?: string;
  inventoryId?: string;
  sellerId?: string;
}

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  couponCode: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
    qty: { type: Number, default: 1, min: 1 },
    variant: { type: String },
    inventoryId: { type: String },
    sellerId: { type: String },
  },
  { _id: false },
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
    couponCode: { type: String, default: null },
  },
  { timestamps: true },
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
