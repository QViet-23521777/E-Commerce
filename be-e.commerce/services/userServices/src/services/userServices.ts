import { User } from "../models/userModel";
import argon2 from "argon2";
import crypto from "crypto";
import { randomInt, createHash } from "crypto";
import { JwtService } from "../utils/jwtService";
import { UserProfile } from "../models/userProfile.Model";
import { Role } from "../models/role.Model";

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

export const registerUser = async ({
  name,
  email,
  password,
}: RegisterInput) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("EMAIL_EXISTS");

  const hashedPassword = await argon2.hash(password);
  const Token = crypto.randomBytes(32).toString("hex");
  const TokenExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const RoleId = await Role.findOne({ name: "user" }).then((role) => role!._id);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    Token,
    TokenExpiredAt,
    roleId: RoleId,
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
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (!user.isVerified) throw new Error("EMAIL_NOT_VERIFIED");

  const isPasswordValid = await argon2.verify(user.password, password);
  if (!isPasswordValid) throw new Error("INVALID_CREDENTIALS");
  const otp = randomInt(100000, 1000000).toString();
  user.otp = createHash("sha256").update(otp).digest("hex");
  await user.save();

  return { user, otp };
};

export const SecondFactorAuth = async (userId: string, otp: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  if (!otp) throw new Error("OTP_REQUIRED");
  const hashedInput = createHash("sha256").update(otp).digest("hex");
  if (hashedInput !== user.otp) {
    throw new Error("INVALID_OTP");
  }
  const tokens = JwtService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: "user",
  });

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
};

export const verifyUserEmail = async (token: string) => {
  const user = await User.findOne({ Token: token });
  if (!user) throw new Error("INVALID_TOKEN");
  if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  user.isVerified = true;
  user.Token = undefined;
  user.TokenExpiredAt = undefined;
  await user.save();

  // Tự tạo profile sau khi verify
  const existingProfile = await UserProfile.findOne({ userId: user._id });
  if (!existingProfile) {
    await UserProfile.create({
      userId: user._id,
      preferences: [],
      searchHistory: [],
    });
  }
};

export const refreshUserToken = async (refreshToken: string) => {
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
};

export const logoutUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    await user.save();
  }
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const getUserProfileById = async (id: string) => {
  const user = await User.findById(id).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const getUserByEmail = async (email: string) => {
  const user = await User.findOne({ email }).select("-password -refreshToken");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const getUserByToken = async (token: string) => {
  const user = await User.findOne({ Token: token }).select(
    "-password -refreshToken",
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const updateUserProfile = async (
  userId: string,
  { name, walletId }: UpdateProfileInput,
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  if (name) user.name = name;

  // Sửa bug — cập nhật walletId đúng cách
  const userProfile = await UserProfile.findOne({ userId: user._id });
  if (walletId && userProfile) {
    userProfile.walletId = walletId;
    await userProfile.save();
  }

  await user.save();
  return user;
};

export const deleteUserAccount = async (userId: string) => {
  await User.findByIdAndDelete(userId);
};

export const setRessetPasswordToken = async (email: string) => {
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
};

export const verifyResetPassword = async (token: string, otp: string) => {
  const user = await User.findOne({ Token: token });
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
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  oldPassword: string,
) => {
  const user = await User.findOne({ Token: token });
  if (!user) throw new Error("INVALID_TOKEN");
  if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }
  if (!newPassword) throw new Error("NEW_PASSWORD_REQUIRED");
  if (await argon2.verify(user.password, newPassword)) {
    throw new Error("PASSWORD_SAME_AS_OLD");
  }
  if (!(await argon2.verify(user.password, oldPassword))) {
    throw new Error("OLD_PASSWORD_INCORRECT");
  }

  user.password = await argon2.hash(newPassword);
  user.Token = undefined;
  user.TokenExpiredAt = undefined;
  await user.save();
};
