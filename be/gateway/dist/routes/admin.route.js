"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const ip_whitelist_1 = require("../middleware/ip.whitelist");
const router = new hono_1.Hono();
router.post("/login", authMiddleware_1.injectInternalSecret, ip_whitelist_1.ipWhitelist, (c) => {
    const targetUrl = `${process.env.USER_SERVICE_URL}/api/admin/login`;
    console.log("🔗 Proxying to:", targetUrl);
    return (0, proxy_1.Request)(c, targetUrl, "POST");
});
router.post("/create", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${process.env.USER_SERVICE_URL}/api/admin/create`, "POST"));
router.post("/verify", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${process.env.USER_SERVICE_URL}/api/admin/verify`, "POST"));
router.post("/ban-user", authMiddleware_1.authenticate, authMiddleware_1.injectInternalSecret, ip_whitelist_1.ipWhitelist, authMiddleware_1.checkAdminAuthorization, (c) => (0, proxy_1.Request)(c, `${process.env.USER_SERVICE_URL}/api/admin/ban-user`, "POST"));
exports.default = router;
