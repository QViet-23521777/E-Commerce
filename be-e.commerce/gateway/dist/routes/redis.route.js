"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;
router.get("/recommendations/:userId", authMiddleware_1.injectInternalSecret, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/redis/recommendations/${userId}`, "GET");
});
router.get("/recommendations-recent/:userId", authMiddleware_1.injectInternalSecret, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/redis/recommendations-recent/${userId}`, "GET");
});
router.post("/recommendations/:userId", authMiddleware_1.injectInternalSecret, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/redis/recommendations/${userId}`, "POST");
});
exports.default = router;
