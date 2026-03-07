"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwtService_1 = require("../utils/jwtService");
const authenticate = async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({
                success: false,
                message: "Authorization header missing or malformed",
            }, 401);
        }
        const token = authHeader.substring(7);
        const decoderd = jwtService_1.JwtService.verifyAccessToken(token);
        c.set("user", {
            id: decoderd.userId,
            email: decoderd.email,
            role: decoderd.role,
        });
        await next();
    }
    catch (error) {
        return c.json({
            success: false,
            message: "Authentication failed",
        }, 401);
    }
};
exports.authenticate = authenticate;
