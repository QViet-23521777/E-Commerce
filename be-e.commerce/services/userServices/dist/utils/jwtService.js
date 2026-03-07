"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtService {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.ACCESS_SECRET, {
            expiresIn: this.ACCESS_EXPIRES_IN,
            issuer: "user-service",
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_EXPIRES_IN,
            issuer: "user-service",
        });
    }
    static generateEmailVerificationToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.ACCESS_SECRET, {
            expiresIn: "24h",
            issuer: "user-service",
        });
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.ACCESS_SECRET);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Access token has expired");
            }
            throw new Error("Invalid access token");
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.REFRESH_SECRET);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Refresh token has expired");
            }
            throw new Error("Invalid refresh token");
        }
    }
    static generateTokenPair(payload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        return { accessToken, refreshToken };
    }
    static generateResetPasswordToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.ACCESS_SECRET, {
            expiresIn: "1h",
            issuer: "user-service",
        });
    }
    static verifyResetPasswordToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.ACCESS_SECRET);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Reset password token has expired");
            }
            throw new Error("Invalid reset password token");
        }
    }
}
exports.JwtService = JwtService;
JwtService.ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "your_access_secret_key";
JwtService.REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";
JwtService.ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
JwtService.REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
