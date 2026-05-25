"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtService {
    // ✅ Dùng khi login / register
    static generateTokenPair(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, this.accessSecret, {
            expiresIn: this.accessExpiresIn,
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.refreshSecret, {
            expiresIn: this.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
    // ✅ Dùng khi refresh token
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.accessSecret, {
            expiresIn: this.accessExpiresIn,
        });
    }
    // ✅ Dùng khi refresh token — verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.refreshSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("TOKEN_EXPIRED");
            }
            throw new Error("INVALID_TOKEN");
        }
    }
    // ✅ Dùng khi reset password
    static generateResetPasswordToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.accessSecret, {
            expiresIn: "1h",
        });
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.accessSecret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("TOKEN_EXPIRED");
            }
            throw new Error("INVALID_TOKEN");
        }
    }
}
exports.JwtService = JwtService;
JwtService.accessSecret = process.env.JWT_SECRET;
JwtService.refreshSecret = process.env.JWT_REFRESH_SECRET;
JwtService.accessExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
JwtService.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
