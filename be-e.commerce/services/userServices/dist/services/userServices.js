"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetPassword = exports.setRessetPasswordToken = exports.deleteUserAccount = exports.updateUserProfile = exports.getUserByToken = exports.getUserByEmail = exports.getUserProfileById = exports.getUserProfile = exports.logoutUser = exports.refreshUserToken = exports.verifyUserEmail = exports.SecondFactorAuth = exports.loginUser = exports.registerUser = void 0;
const userModel_1 = require("../models/userModel");
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("crypto");
const jwtService_1 = require("../utils/jwtService");
const userProfile_Model_1 = require("../models/userProfile.Model");
const role_Model_1 = require("../models/role.Model");
const registerUser = async ({ name, email, password, }) => {
    const existingUser = await userModel_1.User.findOne({ email });
    if (existingUser)
        throw new Error("EMAIL_EXISTS");
    const hashedPassword = await argon2_1.default.hash(password);
    const Token = crypto_1.default.randomBytes(32).toString("hex");
    const TokenExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const RoleId = await role_Model_1.Role.findOne({ name: "user" }).then((role) => role._id);
    const newUser = new userModel_1.User({
        name,
        email,
        password: hashedPassword,
        Token,
        TokenExpiredAt,
        roleId: RoleId,
    });
    await newUser.save();
    console.log("New user created:", newUser);
    const tokens = jwtService_1.JwtService.generateTokenPair({
        userId: newUser._id.toString(),
        email: newUser.email,
        role: "user",
    });
    console.log("Tokens generated for new user:", tokens);
    newUser.refreshToken = tokens.refreshToken;
    await newUser.save();
    console.log("New user registered and saved:", newUser);
    return { user: newUser, tokens, Token };
};
exports.registerUser = registerUser;
const loginUser = async ({ email, password }) => {
    const user = await userModel_1.User.findOne({ email });
    if (!user)
        throw new Error("INVALID_CREDENTIALS");
    if (!user.isVerified)
        throw new Error("EMAIL_NOT_VERIFIED");
    const isPasswordValid = await argon2_1.default.verify(user.password, password);
    if (!isPasswordValid)
        throw new Error("INVALID_CREDENTIALS");
    const otp = (0, crypto_2.randomInt)(100000, 1000000).toString();
    user.otp = (0, crypto_2.createHash)("sha256").update(otp).digest("hex");
    await user.save();
    return { user, otp };
};
exports.loginUser = loginUser;
const SecondFactorAuth = async (userId, otp) => {
    const user = await userModel_1.User.findById(userId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (!otp)
        throw new Error("OTP_REQUIRED");
    const hashedInput = (0, crypto_2.createHash)("sha256").update(otp).digest("hex");
    if (hashedInput !== user.otp) {
        throw new Error("INVALID_OTP");
    }
    const tokens = jwtService_1.JwtService.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: "user",
    });
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return { user, tokens };
};
exports.SecondFactorAuth = SecondFactorAuth;
const verifyUserEmail = async (token) => {
    const user = await userModel_1.User.findOne({ Token: token });
    console.log("Tìm user với token:", token, "Kết quả:", user);
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    user.isVerified = true;
    user.Token = undefined;
    user.TokenExpiredAt = undefined;
    await user.save();
};
exports.verifyUserEmail = verifyUserEmail;
const refreshUserToken = async (refreshToken) => {
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
};
exports.refreshUserToken = refreshUserToken;
const logoutUser = async (userId) => {
    const user = await userModel_1.User.findById(userId);
    if (user) {
        user.refreshToken = undefined;
        await user.save();
    }
};
exports.logoutUser = logoutUser;
const getUserProfile = async (userId) => {
    const user = await userModel_1.User.findById(userId).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
};
exports.getUserProfile = getUserProfile;
const getUserProfileById = async (id) => {
    const user = await userModel_1.User.findById(id).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
};
exports.getUserProfileById = getUserProfileById;
const getUserByEmail = async (email) => {
    const user = await userModel_1.User.findOne({ email }).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
};
exports.getUserByEmail = getUserByEmail;
const getUserByToken = async (token) => {
    const user = await userModel_1.User.findOne({ Token: token }).select("-password -refreshToken");
    if (!user)
        throw new Error("USER_NOT_FOUND");
    return user;
};
exports.getUserByToken = getUserByToken;
const updateUserProfile = async (userId, { name, walletId }) => {
    const user = await userModel_1.User.findById(userId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (name)
        user.name = name;
    const userProfile = await userProfile_Model_1.UserProfile.findOne({ userId: user._id }).select("walletId");
    if (userProfile)
        userProfile.walletId = userProfile.walletId;
    await user.save();
    return user;
};
exports.updateUserProfile = updateUserProfile;
const deleteUserAccount = async (userId) => {
    await userModel_1.User.findByIdAndDelete(userId);
};
exports.deleteUserAccount = deleteUserAccount;
const setRessetPasswordToken = async (email) => {
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
    user.otp = (0, crypto_2.createHash)("sha256").update(otp).digest("hex");
    await user.save();
    return { token, otp };
};
exports.setRessetPasswordToken = setRessetPasswordToken;
const verifyResetPassword = async (token, otp) => {
    const user = await userModel_1.User.findOne({ Token: token });
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    const hashedInput = (0, crypto_2.createHash)("sha256").update(otp).digest("hex");
    if (hashedInput !== user.otp) {
        throw new Error("INVALID_OTP");
    }
    user.otp = undefined;
    await user.save();
};
exports.verifyResetPassword = verifyResetPassword;
const resetPassword = async (token, newPassword, oldPassword) => {
    const user = await userModel_1.User.findOne({ Token: token });
    if (!user)
        throw new Error("INVALID_TOKEN");
    if (!user.TokenExpiredAt || user.TokenExpiredAt < new Date()) {
        throw new Error("TOKEN_EXPIRED");
    }
    if (!newPassword)
        throw new Error("NEW_PASSWORD_REQUIRED");
    const newwpasswordHash = await argon2_1.default.hash(newPassword);
    if (await argon2_1.default.verify(user.password, newPassword)) {
        throw new Error("PASSWORD_SAME_AS_OLD");
    }
    if (!(await argon2_1.default.verify(user.password, oldPassword))) {
        throw new Error("OLD_PASSWORD_INCORRECT");
    }
    user.password = await argon2_1.default.hash(newPassword);
    user.Token = undefined;
    user.TokenExpiredAt = undefined;
    await user.save();
};
exports.resetPassword = resetPassword;
