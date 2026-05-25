"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
const BASE = process.env.ACTIVITY_SERVICE_URL;
router.post("/", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${BASE}/api/activities`, "POST"));
router.post("/flush/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/activities/flush/${userId}`, "POST");
});
router.get("/queue/:userId", authMiddleware_1.injectInternalSecret, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/activities/queue/${userId}`, "GET");
});
router.get("/history/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/activities/history/${userId}`, "GET");
});
router.get("/recent/:userId", authMiddleware_1.injectInternalSecret, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/activities/recent/${userId}`, "GET");
});
router.delete("/queue/:userId", authMiddleware_1.authenticate, (c) => {
    const userId = c.req.param("userId");
    return (0, proxy_1.Request)(c, `${BASE}/api/activities/queue/${userId}`, "DELETE");
});
exports.default = router;
