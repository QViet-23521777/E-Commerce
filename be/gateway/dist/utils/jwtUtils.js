"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JwtUtils {
    static verifyToken(token, secret) {
        try {
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error("Token has expired");
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error("Invalid token signature");
            }
            throw new Error("Token verification failed");
        }
    }
}
exports.JwtUtils = JwtUtils;
