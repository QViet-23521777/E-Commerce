"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.USER_SERVICE_URL;
router.post("/create", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/sellers/create`, "POST"));
router.post("/verify", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/sellers/verify`, "POST"));
router.get("/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/sellers/${userId}`, "GET");
});
router.put("/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/sellers/${userId}`, "PUT");
});
router.delete("/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/sellers/${userId}`, "DELETE");
});
exports.default = router;
