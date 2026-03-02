import mongoose, { Schema, Document, Model } from "mongoose";
import { time } from "node:console";
export interface User extends Document {
  name: string;
  email: string;
  password: string;
  walletId?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isVerified: boolean;
  Token?: string;
  TokenExpiredAt?: Date;
  otp?: string;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true, minLength: 8 },
    walletId: { type: String, trim: true },
    refreshToken: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    Token: { type: String },
    TokenExpiredAt: { type: Date },
    otp: { type: String },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ walletId: 1 });

export const User: Model<User> = mongoose.model<User>("User", UserSchema);
