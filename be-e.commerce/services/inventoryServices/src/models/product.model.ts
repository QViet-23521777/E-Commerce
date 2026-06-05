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
    // Seller's public response to this review.
    reply?: { body: string; author: string; at: Date };
    // Hidden by an admin (abuse/moderation). Hidden reviews are excluded from
    // the public storefront and from the aggregate rating.
    hidden?: boolean;
    // How many buyers have flagged this review — surfaces it in the admin queue.
    reportedCount?: number;
  }[];
}

// Embedded review sub-document. _id disabled — reviews are addressed by their
// position (index) in the array, which is stable because reviews are only ever
// appended (moderation hides rather than removes).
const ReviewSchema = new Schema(
  {
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    text: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    reply: {
      type: new Schema(
        {
          body: { type: String, required: true },
          author: { type: String, default: "Shop" },
          at: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
      default: undefined,
    },
    hidden: { type: Boolean, default: false },
    reportedCount: { type: Number, default: 0 },
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
