import mongoose, { Document } from "mongoose";
export interface IInventory extends Document {
  name: string;
  sellerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  price: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new mongoose.Schema<IInventory>(
  {
    name: { type: String, required: true },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
  },
  { timestamps: true },
);

const Inventory = mongoose.model<IInventory>("Inventory", inventorySchema);

export default Inventory;
