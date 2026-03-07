"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.verifyUserEmail = verifyUserEmail;
exports.refreshUserToken = refreshUserToken;
exports.logoutUser = logoutUser;
exports.getUserProfile = getUserProfile;
exports.getUserProfileById = getUserProfileById;
exports.getUserByEmail = getUserByEmail;
exports.getUserByToken = getUserByToken;
exports.updateUserProfile = updateUserProfile;
exports.deleteUserAccount = deleteUserAccount;
exports.setRessetPasswordToken = setRessetPasswordToken;
exports.verifyResetPassword = verifyResetPassword;
exports.resetPassword = resetPassword;
const userModel_1 = require("../models/userModel");
const argon2_1 = __importDefault(require("argon2"));
const jwtService_1 = require("../utils/jwtService");
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("crypto");
const crypto_3 = require("crypto");
async function registerUser({ name, email, password }) {
    const existingUser = await userModel_1.User.findOne({ email });
    if (existingUser)
        throw new Error("EMAIL_EXISTS");
    const hashedPassword = await argon2_1.default.hash(password);
    const Token = crypto_1.default.randomBytes(32).toString("hex");
    const TokenExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const newUser = new userModel_1.User({
        name,
        email,
        password: hashedPassword,
        Token,
        TokenExpiredAt,
    });
    await newUser.save();
    const tokens = jwtService_1.JwtService.generateTokenPair({
        userId: newUser._id.toString(),
        email: newUser.email,
        role: "user",
    });
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save();
    return { user: newUser, tokens, Token };
}
async function loginUser({ email, password }) {
    const user = await userModel_1.User.findOne({ email });
    if (!user)
        throw new Error("INVALID_CREDENTIALS");
    if (!user.isVerified)
        throw new Error("EMAIL_NOT_VERIFIED");
    const isPasswordValid = await argon2_1.default.verify(user.password, password);
    if (!isPasswordValid)
        throw new Error("INVALID_CREDENTIALS");
    const tokens = jwtService_1.JwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: "user",
    });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return { user, tokens };
}
async function verifyUserEmail(token) {
    const user = await userModel_1.User.findOne({ Token: token });
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    user.isVerified = true;
    user.Token = undefined;
    user.TokenExpiredAt = undefined;
    await user.save();
}
async function refreshUserToken(refreshToken) {
    const decoded = jwtService_1.JwtService.verifyRefreshToken(refreshToken);
    const user = await userModel_1.User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
        throw new Error("INVALID_TOKEN");
    }
    const accessToken = jwtService_1.JwtService.generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: "user",
    });
    return { accessToken };
}
async function logoutUser(userId) {
    const user = await userModel_1.User.findById(userId);
    if (user) {
        user.refreshToken = undefined;
        await user.save();
    }
}
async function getUserProfile(userId) {
    const user = await userModel_1.User.findById(userId).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
}
async function getUserProfileById(id) {
    const user = await userModel_1.User.findById(id).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
}
async function getUserByEmail(email) {
    const user = await userModel_1.User.findOne({ email }).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
}
async function getUserByToken(token) {
    const user = await userModel_1.User.findOne({ Token: token }).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
}
async function updateUserProfile(userId, { name, walletId }) {
    const user = await userModel_1.User.findById(userId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (name)
        user.name = name;
    if (walletId)
        user.walletId = walletId;
    await user.save();
    return user;
}
async function deleteUserAccount(userId) {
    await userModel_1.User.findByIdAndDelete(userId);
}
async function setRessetPasswordToken(email) {
    const user = await userModel_1.User.findOne({ email });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const token = jwtService_1.JwtService.generateResetPasswordToken({
        userId: user._id.toString(),
        email: user.email,
        role: "user",
    });
    const otp = (0, crypto_2.randomInt)(100000, 1000000).toString();
    user.Token = token;
    user.TokenExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
    user.otp = (0, crypto_3.createHash)("sha256").update(otp).digest("hex");
    await user.save();
    return { token, otp };
}
async function verifyResetPassword(token, otp) {
    const user = await userModel_1.User.findOne({ Token: token });
    console.log(token);
    console.log(user);
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    const hashedInput = (0, crypto_3.createHash)("sha256").update(otp).digest("hex");
    if (hashedInput !== user.otp) {
        throw new Error("INVALID_OTP");
    }
    user.otp = undefined;
    await user.save();
}
async function resetPassword(token, newPassword) {
    const user = await userModel_1.User.findOne({ Token: token });
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    user.password = await argon2_1.default.hash(newPassword);
    user.Token = undefined;
    user.TokenExpiredAt = undefined;
    await user.save();
}
