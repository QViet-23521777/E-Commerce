import mongoose, { Schema, Document } from "mongoose";

export interface PProduct extends Document {
  name: string;
  normalize: string;
  description: string;
  price: number;
  sale?: number;
  imageUrl: string;
  type: string;
  point: number;
  numPurchases?: number;
  createdAt: Date;
  updatedAt: Date;
  track?: number;
}

const InventorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalize: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    sale: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, required: true },
    point: { type: Number, required: true, default: 0 },
    numPurchases: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Product = mongoose.model<PProduct>("Product", InventorySchema);
