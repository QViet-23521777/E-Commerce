"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailClient = void 0;
const axios_1 = __importDefault(require("axios"));
const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || "http://localhost:3002";
exports.mailClient = {
    sendVerifyEmail: (email, name, verifyUrl) => axios_1.default.post(`${MAIL_SERVICE_URL}/test/verify-email`, {
        email,
        name,
        verifyUrl,
    }),
    sendResetPassword: (email, name, token, otp, expiredAt) => axios_1.default.post(`${MAIL_SERVICE_URL}/test/reset-password`, {
        email,
        name,
        token,
        otp,
        expiredAt,
    }),
    sendLoginEmail: (email, name, otp, expiredAt) => axios_1.default.post(`${MAIL_SERVICE_URL}/test/login-notification`, {
        email,
        name,
        otp,
        expiredAt,
    }),
    sendSellerAccountVerificationEmail: (email, otp, expiredAt) => axios_1.default.post(`${MAIL_SERVICE_URL}/test/seller-account-verification`, {
        email,
        otp,
        expiredAt,
    }),
    sendAdminAccountVerificationEmail: async (email, token, expiredAt) => {
        try {
            await axios_1.default.post(`${MAIL_SERVICE_URL}/test/send-admin-mail`, {
                email,
                token,
                expiredAt,
            });
            console.log("Admin account verification email sent:", {
                email,
                token,
                expiredAt,
            });
        }
        catch (error) {
            console.error("Failed to send admin verification email:", error.message);
            throw error;
        }
    },
};
