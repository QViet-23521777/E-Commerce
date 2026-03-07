"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.verifyingResetPassword = exports.sendVerifyPasswordEmail = exports.deleteAccount = exports.updateProfile = exports.getProfileById = exports.profile = exports.verifyToken = exports.logout = exports.refreshToken = exports.login = exports.verifyEmail = exports.register = void 0;
const jwtService_1 = require("../utils/jwtService");
const userServices_1 = require("../services/userServices");
const mailClient_1 = require("../utils/mailClient");
const HTTP_STATUS = {
    EMAIL_EXISTS: 400,
    INVALID_CREDENTIALS: 401,
    EMAIL_NOT_VERIFIED: 401,
    USER_NOT_FOUND: 404,
    INVALID_TOKEN: 401,
    TOKEN_EXPIRED: 400,
};
function handleError(c, error) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    const status = HTTP_STATUS[message] ?? 500;
    return c.json({ success: false, message }, status);
}
const register = async (c) => {
    try {
        const { name, email, password } = await c.req.json();
        const { user, tokens, Token } = await (0, userServices_1.registerUser)({
            name,
            email,
            password,
        });
        const verifyUrl = `${process.env.APP_URL || "http://localhost:3001"}/api/users/verify-email?token=${Token}`;
        mailClient_1.mailClient.sendVerifyEmail(user.email, user.name, verifyUrl);
        return c.json({
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tokens,
        }, 201);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.register = register;
const verifyEmail = async (c) => {
    try {
        const token = c.req.query("token");
        if (!token)
            return c.json({ success: false, message: "Token is required" }, 400);
        await (0, userServices_1.verifyUserEmail)(token);
        return c.json({ success: true, message: "Email verified successfully" }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.verifyEmail = verifyEmail;
const login = async (c) => {
    try {
        const { email, password } = await c.req.json();
        const { user, tokens } = await (0, userServices_1.loginUser)({ email, password });
        return c.json({
            success: true,
            message: "User logged in successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tokens,
        }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.login = login;
const refreshToken = async (c) => {
    try {
        const { refreshToken } = await c.req.json();
        if (!refreshToken) {
            return c.json({ success: false, message: "Refresh token is required" }, 400);
        }
        const { accessToken } = await (0, userServices_1.refreshUserToken)(refreshToken);
        return c.json({
            success: true,
            message: "Token refreshed successfully",
            data: { accessToken },
        }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.refreshToken = refreshToken;
const logout = async (c) => {
    try {
        const { userId } = await c.req.json();
        if (!userId) {
            return c.json({ success: false, message: "User ID is required" }, 400);
        }
        await (0, userServices_1.logoutUser)(userId);
        return c.json({ success: true, message: "Logout successful" }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.logout = logout;
const verifyToken = async (c) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ success: false, message: "No token provided" }, 401);
        }
        const token = authHeader.substring(7);
        const decoded = jwtService_1.JwtService.verifyAccessToken(token);
        return c.json({
            success: true,
            data: {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            },
        }, 200);
    }
    catch (error) {
        return c.json({ success: false, message: "Invalid or expired token" }, 401);
    }
};
exports.verifyToken = verifyToken;
const profile = async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ success: false, message: "User not authenticated" }, 401);
        const userData = await (0, userServices_1.getUserProfile)(user.id);
        return c.json({
            success: true,
            data: {
                id: userData._id,
                name: userData.name,
                email: userData.email,
                walletId: userData.walletId,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
            },
        }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.profile = profile;
const getProfileById = async (c) => {
    try {
        const { id } = c.req.param();
        const userData = await (0, userServices_1.getUserProfileById)(id);
        return c.json({
            success: true,
            data: {
                id: userData._id,
                name: userData.name,
                email: userData.email,
                walletId: userData.walletId,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
            },
        }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.getProfileById = getProfileById;
const updateProfile = async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ success: false, message: "User not authenticated" }, 401);
        const { name, walletId } = await c.req.json();
        const userData = await (0, userServices_1.updateUserProfile)(user.id, { name, walletId });
        return c.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: userData._id,
                name: userData.name,
                email: userData.email,
                walletId: userData.walletId,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
            },
        }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.updateProfile = updateProfile;
const deleteAccount = async (c) => {
    try {
        const user = c.get("user");
        if (!user)
            return c.json({ success: false, message: "User not authenticated" }, 401);
        await (0, userServices_1.deleteUserAccount)(user.id);
        return c.json({ success: true, message: "Account deleted successfully" }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.deleteAccount = deleteAccount;
const sendVerifyPasswordEmail = async (c) => {
    try {
        const { email } = await c.req.json();
        if (!email)
            return c.json({ success: false, message: "Email is required" }, 400);
        const user = await (0, userServices_1.getUserByEmail)(email);
        if (!user)
            return c.json({ success: false, message: "User not found" }, 404);
        const { token, otp } = await (0, userServices_1.setRessetPasswordToken)(user.email);
        await mailClient_1.mailClient.sendResetPassword(user.email, user.name, token, otp, new Date(Date.now() + 3600000).toISOString());
        return c.json({ success: true, message: "Reset password email sent" }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.sendVerifyPasswordEmail = sendVerifyPasswordEmail;
const verifyingResetPassword = async (c) => {
    try {
        const token = c.req.query("token");
        const { otp } = await c.req.json();
        if (!token)
            return c.json({ success: false, message: "Token is required" }, 400);
        if (!otp)
            return c.json({ success: false, message: "OTP is required" }, 400);
        await (0, userServices_1.verifyResetPassword)(token, otp);
        return c.json({ success: true, message: "Token is valid" }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.verifyingResetPassword = verifyingResetPassword;
const changePassword = async (c) => {
    try {
        const { token, newPassword } = await c.req.json();
        if (!token)
            return c.json({ success: false, message: "Token is required" }, 400);
        if (!newPassword)
            return c.json({ success: false, message: "New password is required" }, 400);
        const user = await (0, userServices_1.getUserByToken)(token);
        if (!user)
            return c.json({ success: false, message: "User not found" }, 404);
        await (0, userServices_1.resetPassword)(token, newPassword);
        return c.json({ success: true, message: "Complete change password." }, 200);
    }
    catch (error) {
        return handleError(c, error);
    }
};
exports.changePassword = changePassword;
