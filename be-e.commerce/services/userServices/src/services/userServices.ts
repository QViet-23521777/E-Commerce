import { User } from "../models/userModel";
import argon2 from "argon2";
import { JwtService } from "../utils/jwtService";
import crypto from "crypto";
import { randomInt } from "crypto";
import { createHash } from "crypto";
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  walletId?: string;
}

export async function registerUser({ name, email, password }: RegisterInput) {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("EMAIL_EXISTS");

  const hashedPassword = await argon2.hash(password);
  const Token = crypto.randomBytes(32).toString("hex");
  const TokenExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    Token,
    TokenExpiredAt,
  });
  await newUser.save();

  const tokens = JwtService.generateTokenPair({
    userId: newUser._id.toString(),
    email: newUser.email,
    role: "user",
  });

  newUser.refreshToken = tokens.refreshToken;
  await newUser.save();

  return { user: newUser, tokens, Token };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (!user.isVerified) throw new Error("EMAIL_NOT_VERIFIED");

  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) throw new Error("INVALID_CREDENTIALS");

  const tokens = JwtService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: "user",
  });

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
}

export async function verifyUserEmail(token: string) {
  const user = await User.findOne({ Token: token });
  if (!user) throw new Error("INVALID_TOKEN");
  if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  user.isVerified = true;
  user.Token = undefined;
  user.TokenExpiredAt = undefined;
  await user.save();
}

export async function refreshUserToken(refreshToken: string) {
  const decoded = JwtService.verifyRefreshToken(refreshToken);

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshToken !== refreshToken) {
    throw new Error("INVALID_TOKEN");
  }

  const accessToken = JwtService.generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: "user",
  });

  return { accessToken };
}

export async function logoutUser(userId: string) {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }
}

export async function getUserProfile(userId: string) {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function getUserProfileById(id: string) {
  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await User.findOne({ email }).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function getUserByToken(token: string) {
  const user = await User.findOne({ Token: token }).select(
    "-password -refreshToken",
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
}

export async function updateUserProfile(
  userId: string,
  { name, walletId }: UpdateProfileInput,
) {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  if (name) user.name = name;
  if (walletId) user.walletId = walletId;
  await user.save();

  return user;
}

export async function deleteUserAccount(userId: string) {
  await User.findByIdAndDelete(userId);
}

export async function setRessetPasswordToken(email: string) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  const token = JwtService.generateResetPasswordToken({
    userId: user._id.toString(),
    email: user.email,
    role: "user",
  });

  const otp = randomInt(100000, 1000000).toString();

  user.Token = token;
  user.TokenExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
  user.otp = createHash("sha256").update(otp).digest("hex");
  await user.save();

  return { token, otp };
}

export async function verifyResetPassword(token: string, otp: string) {
  const user = await User.findOne({ Token: token });
  console.log(token);
  console.log(user);
  if (!user) throw new Error("INVALID_TOKEN");
  if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  const hashedInput = createHash("sha256").update(otp).digest("hex");
  if (hashedInput !== user.otp) {
    throw new Error("INVALID_OTP");
  }

  user.otp = undefined;
  await user.save();
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await User.findOne({ Token: token });
  if (!user) throw new Error("INVALID_TOKEN");
  if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  user.password = await argon2.hash(newPassword);
  user.Token = undefined;
  user.TokenExpiredAt = undefined;
  await user.save();
}
