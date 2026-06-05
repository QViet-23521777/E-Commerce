import mongoose, { Schema, Document } from "mongoose";

// A managed storefront category. `productType` links the category to the real
// product taxonomy (the capitalized `type` string used by the catalog, e.g.
// "Electronics") so the storefront can route a category to /top/type/:type.
export interface ICategory extends Document {
  label: string;
  slug: string;
  iconName: string;
  productType: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    label: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    iconName: { type: String, default: "ShoppingBag" },
    productType: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
