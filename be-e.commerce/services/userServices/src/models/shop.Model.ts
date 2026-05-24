import mongoose, { Document } from "mongoose";
export interface UserShop extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  userProfileId?: mongoose.Types.ObjectId;
  numGoods?: number;
}

const UserShopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    walletId: { type: String, trim: true },
    preferences: { type: [String], default: [] },
    searchHistory: { type: [String], default: [] },
    avatar: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);
export const UserShop = mongoose.model<UserShop>("UserShop", UserShopSchema);
