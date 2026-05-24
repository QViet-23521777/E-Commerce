"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;
router.get("/search", authMiddleware_1.injectInternalSecret, (c) => {
    const q = c.req.query("q");
    const limit = c.req.query("limit");
    return (0, proxy_1.Request)(c, `${BASE}/api/products/search?q=${q}&limit=${limit}`, "GET");
});
router.get("/top/purchases", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products/top/purchases`, "GET"));
router.get("/top/sale", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products/top/sale`, "GET"));
router.get("/top/point", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products/top/point`, "GET"));
router.get("/top/list-type", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products/top/list-type`, "GET"));
router.get("/top/type/:type", authMiddleware_1.injectInternalSecret, (c) => {
    const type = c.req.param("type");
    return (0, proxy_1.Request)(c, `${BASE}/api/products/top/type/${type}`, "GET");
});
router.post("/recommend", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products/recommend`, "POST"));
router.post("/recommend/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/products/recommend/${userId}`, "POST");
});
router.post("/", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/products`, "POST"));
router.get("/:productId", authMiddleware_1.injectInternalSecret, (c) => {
    const productId = c.req.param("productId");
    return (0, proxy_1.Request)(c, `${BASE}/api/products/${productId}`, "GET");
});
exports.default = router;
