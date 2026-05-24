"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.USER_SERVICE_URL;
router.post("/register", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/register`, "POST"));
router.post("/login", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/login`, "POST"));
router.post("/second-factor-auth", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/second-factor-auth`, "POST"));
router.post("/refresh-token", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/refresh-token`, "POST"));
router.get("/verify-email", authMiddleware_1.injectInternalSecret, (c) => {
    const token = c.req.query("token");
    const url = `${BASE}/api/users/verify-email?token=${token}`;
    return (0, proxy_1.Request)(c, url, "GET");
});
router.post("/send-reset-password-email", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/send-reset-password-email`, "POST"));
router.post("/verify-resetpassword", authMiddleware_1.injectInternalSecret, (c) => {
    const token = c.req.query("token");
    return (0, proxy_1.Request)(c, `${BASE}/api/users/verify-resetpassword?token=${token}`, "POST");
});
router.post("/change-password", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/change-password`, "POST"));
router.post("/logout", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/logout`, "POST"));
router.get("/profile", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/profile`, "GET"));
router.get("/profile/:id", authMiddleware_1.authenticate, (c) => {
    const id = c.req.param("id");
    return (0, proxy_1.Request)(c, `${BASE}/api/users/profile/${id}`, "GET");
});
router.put("/profile", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/profile`, "PUT"));
router.delete("/profile", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/users/profile`, "DELETE"));
exports.default = router;
