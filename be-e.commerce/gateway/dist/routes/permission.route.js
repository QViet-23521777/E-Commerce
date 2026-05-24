"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const authMiddleware_1 = require("../middleware/authMiddleware");
const proxy_1 = require("../utils/proxy");
const router = new hono_1.Hono();
router.post("/check", authMiddleware_1.authenticate, (c) => (0, proxy_1.Request)(c, `${process.env.USER_SERVICE_URL}/api/permissions/check`, "POST"));
exports.default = router;
