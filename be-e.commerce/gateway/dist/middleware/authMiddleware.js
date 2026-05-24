"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminAuthorization = exports.injectInternalSecret = exports.authorize = exports.authenticate = void 0;
const jwtUtils_1 = require("../utils/jwtUtils");
const authenticate = async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization");
        console.log("Auth header:", authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("❌ Missing or malformed auth header");
            return c.json({
                success: false,
                message: "Authorization header missing or malformed",
            }, 401);
        }
        const token = authHeader.substring(7);
        const decoded = jwtUtils_1.JwtUtils.verifyToken(token, process.env.JWT_SECRET);
        console.log("✅ Token decoded:", decoded);
        c.set("userId", decoded.userId);
        c.set("userEmail", decoded.email);
        c.set("userRole", decoded.role ?? "user");
        c.req.raw.headers.set("x-user-id", decoded.userId);
        c.req.raw.headers.set("x-user-email", decoded.email);
        c.req.raw.headers.set("x-user-role", decoded.role ?? "user");
        c.req.raw.headers.set("x-internal-secret", process.env.INTERNAL_SECRET);
        console.log("✅ User authenticated:", decoded.email);
        await next();
    }
    catch (error) {
        console.error("❌ Auth error:", error);
        return c.json({ success: false, message: "Authentication failed" }, 401);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return async (c, next) => {
        const userId = c.req.header("x-user-id");
        const role = c.req.header("x-user-role");
        if (!userId || !role || !roles.includes(role)) {
            return c.json({
                success: false,
                message: "Forbidden: You don't have permission to access this resource",
            }, 403);
        }
        await next();
    };
};
exports.authorize = authorize;
const injectInternalSecret = async (c, next) => {
    c.req.raw.headers.set("x-internal-secret", process.env.INTERNAL_SECRET);
    console.log("✅ Injected internal secret");
    await next();
};
exports.injectInternalSecret = injectInternalSecret;
const checkAdminAuthorization = async (c, next) => {
    console.log("Checking admin authorization...");
    const role = c.get("userRole") ?? c.req.header("x-user-role");
    console.log("Role value:", role);
    console.log("Role type:", typeof role);
    console.log("Role length:", role?.length);
    if (role !== "admin") {
        return c.json({
            success: false,
            message: "Forbidden: Admin access required",
        }, 403);
    }
    console.log("✅ User authorized as admin");
    await next();
};
exports.checkAdminAuthorization = checkAdminAuthorization;
