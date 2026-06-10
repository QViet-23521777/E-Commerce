import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import crypto from "crypto";
import { JwtService } from "../utils/jwt.service";
import { Jwt } from "hono/utils/jwt";
interface CreateSellerInput {
  userId: string;
  address: string;
  phone: string;
  walletId?: string;
}

export const createSellerAccount = async ({
  userId,
  address,
  phone,
}: CreateSellerInput) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  const currentRole = await Role.findById(user.roleId);
  if (currentRole?.name === "seller") throw new Error("USER_ALREADY_A_SELLER");

  const sellerRole = await Role.findOne({ name: "seller" });
  if (!sellerRole) throw new Error("SELLER_ROLE_NOT_FOUND");
  if (!address) throw new Error("ADDRESS_REQUIRED");
  if (!phone) throw new Error("PHONE_REQUIRED");

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  await user.save();
  return { user, otp };
};

export const verifySeller = async (userId: string, otp: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.otp !== otp) throw new Error("INVALID_OTP");

  user.roleId = (await Role.findOne({ name: "seller" }))!._id;
  user.otp = undefined;
  const tokens = await JwtService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: "seller",
  });
  user.refreshToken = tokens.refreshToken;
  await user.save();
  return { user, tokens };
};

export const getSellerProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const updateSellerProfile = async (
  userId: string,
  updates: { avatar?: string; phone?: string; address?: string; walletId?: string },
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  Object.assign(user, updates);
  await user.save();
  return user;
};

export const deleteSellerAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  await user.deleteOne();
  return { message: "Seller account deleted successfully" };
};

export const getSellerPublicProfile = async (userId: string) => {
  const user = await User.findById(userId).select("name address avatar");
  if (!user) throw new Error("USER_NOT_FOUND");
  return {
    id: user._id,
    name: user.name,
    address: user.address ?? "",
    avatar: user.avatar ?? "",
  };
};
