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

const InventorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    normalize: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },

    sale: { type: Number, default: 0 },

    imageUrl: { type: String },

    type: { type: String },

    point: { type: Number, default: 0 },

    numPurchases: { type: Number, default: 0 },

    track: { type: Number },
  },
  { timestamps: true },
);

export const Product =
  mongoose.models.Product ||
  mongoose.model<PProduct>("Product", InventorySchema, "product");
