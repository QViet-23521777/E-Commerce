"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;
router.post("/", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/inventory`, "POST"));
router.get("/seller/:sellerId", authMiddleware_1.authenticate, (c) => {
    const sellerId = c.req.param("sellerId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/seller/${sellerId}`, "GET");
});
router.get("/search", authMiddleware_1.injectInternalSecret, (c) => {
    const name = c.req.query("name") ?? "";
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/search?name=${name}`, "GET");
});
router.get("/:inventoryId", authMiddleware_1.authenticate, (c) => {
    const inventoryId = c.req.param("inventoryId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/${inventoryId}`, "GET");
});
router.put("/:inventoryId/quantity", authMiddleware_1.authenticate, (c) => {
    const inventoryId = c.req.param("inventoryId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/${inventoryId}/quantity`, "PUT");
});
router.post("/:inventoryId/buy", authMiddleware_1.authenticate, (c) => {
    const inventoryId = c.req.param("inventoryId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/${inventoryId}/buy`, "POST");
});
router.post("/buy/batch", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/inventory/buy/batch`, "POST"));
router.post("/check", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/inventory/check`, "POST"));
router.post("/:inventoryId/restore", authMiddleware_1.injectInternalSecret, (c) => {
    const inventoryId = c.req.param("inventoryId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/${inventoryId}/restore`, "POST");
});
router.post("/restore/batch", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/inventory/restore/batch`, "POST"));
router.delete("/:inventoryId", authMiddleware_1.authenticate, (c) => {
    const inventoryId = c.req.param("inventoryId");
    return (0, proxy_1.Request)(c, `${BASE}/api/inventory/${inventoryId}`, "DELETE");
});
exports.default = router;
