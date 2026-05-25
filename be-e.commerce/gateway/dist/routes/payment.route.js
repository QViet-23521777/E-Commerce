"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.PAYMENT_SERVICE_URL;
router.post("/momo/create", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/payments/momo/create`, "POST"));
router.post("/momo/ipn", authMiddleware_1.injectInternalSecret, (c) => (0, proxy_1.Request)(c, `${BASE}/api/payments/momo/ipn`, "POST"));
router.post("/wallet/checkout", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/payments/wallet/checkout`, "POST"));
router.get("/:orderId", authMiddleware_1.authenticate, (c) => {
    const orderId = c.req.param("orderId");
    return (0, proxy_1.Request)(c, `${BASE}/api/payments/${orderId}`, "GET");
});
exports.default = router;
