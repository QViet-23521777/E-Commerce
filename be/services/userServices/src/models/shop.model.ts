import mongoose, { Document } from "mongoose";
export interface UserShop extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  numGoods?: number;
  walletId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

const UserShopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    walletId: { type: String, trim: true },
    avatar: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);
export const UserShop = mongoose.model<UserShop>("UserShop", UserShopSchema);
