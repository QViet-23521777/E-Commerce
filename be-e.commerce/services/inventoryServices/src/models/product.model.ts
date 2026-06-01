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
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  rating?: number;
  numReviews?: number;
  reviews?: {
    author: string;
    rating: number;
    text: string;
    date: Date;
  }[];
}

// Embedded review sub-document. _id disabled — reviews are seeded/aggregated,
// not addressed individually.
const ReviewSchema = new Schema(
  {
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    text: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const ProductSchema = new Schema(
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

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews: { type: [ReviewSchema], default: [] },
  },
  { timestamps: true },
);

export const Product =
  mongoose.models.Product ||
  mongoose.model<PProduct>("Product", ProductSchema, "product");
