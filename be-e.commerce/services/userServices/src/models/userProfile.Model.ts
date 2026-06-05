import mongoose, { Document } from "mongoose";

// A saved delivery address. `id` is a client-generated number so the storefront
// can manage the list locally; the whole array is replaced on save.
export interface SavedAddress {
  id: number;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserProfile extends Document {
  userId: mongoose.Types.ObjectId;
  walletId?: string;
  preferences?: string[];
  searchHistory?: string[];
  avatar?: string;
  phone?: string;
  address?: string;
  // Wishlist — catalogue product ids the user has favourited.
  productId?: string[];
  addresses?: SavedAddress[];
}

const AddressSchema = new mongoose.Schema(
  {
    id: { type: Number },
    label: { type: String, trim: true },
    name: { type: String, trim: true },
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

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
    addresses: { type: [AddressSchema], default: [] },
  },
  {
    timestamps: true,
  },
);
export const UserProfile = mongoose.model<UserProfile>(
  "UserProfile",
  UserProfileSchema,
);
