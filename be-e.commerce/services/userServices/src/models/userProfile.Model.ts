import mongoose, { Document } from "mongoose";
export interface UserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  walletId?: string;
  preferences?: string[];
  searchHistory?: string[];
  avatar?: string;
  phone?: string;
  address?: string;
}

const UserProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    walletId: { type: String, trim: true },
    preferences: { type: [String], default: [] },
    searchHistory: { type: [String], default: [] },
    avatar: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    productId: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);
export const UserProfile = mongoose.model<UserProfile>(
  "UserProfile",
  UserProfileSchema,
);
