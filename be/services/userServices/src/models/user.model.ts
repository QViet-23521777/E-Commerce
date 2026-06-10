import mongoose, { Schema, Document, Model } from "mongoose";
export interface User extends Document {
  name: string;
  email: string;
  password: string;
  roleId: mongoose.Types.ObjectId;
  walletId?: string;
  ip?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
  Token?: string;
  TokenExpiredAt?: Date;
  otp?: string;
  twoFactorEnabled: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  preferences: string[];
  searchHistory: string[];
  productId: string[];
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true, minLength: 8 },
    roleId: { type: mongoose.Types.ObjectId, ref: "Role", required: true },
    walletId: { type: String, trim: true },
    refreshToken: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    Token: { type: String },
    TokenExpiredAt: { type: Date },
    otp: { type: String },
    // When false, login skips the emailed OTP step (second-factor). Default true
    // preserves the existing mandatory-2FA behavior for every existing account.
    twoFactorEnabled: { type: Boolean, default: true },
    avatar: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    preferences: { type: [String], default: [] },
    searchHistory: { type: [String], default: [] },
    productId: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ walletId: 1 });

export const User: Model<User> = mongoose.model<User>("User", UserSchema);
