import { Hono } from "hono";
import {
  authenticate,
  checkAdminAuthorization,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";
import { ipWhitelist } from "../middleware/ip.whitelist";
const router = new Hono();

const INVENTORY_BASE =
  process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;

router.post("/login", injectInternalSecret, ipWhitelist, (c) => {
  const targetUrl = `${process.env.USER_SERVICE_URL}/api/admin/login`;
  console.log("🔗 Proxying to:", targetUrl);
  return Request(c, targetUrl, "POST");
});

router.post("/second-factor-auth", injectInternalSecret, ipWhitelist, (c) =>
  Request(
    c,
    `${process.env.USER_SERVICE_URL}/api/admin/second-factor-auth`,
    "POST",
  ),
);

router.post("/create", injectInternalSecret, (c) =>
  Request(c, `${process.env.USER_SERVICE_URL}/api/admin/create`, "POST"),
);

router.post("/verify", injectInternalSecret, (c) =>
  Request(c, `${process.env.USER_SERVICE_URL}/api/admin/verify`, "POST"),
);

router.post(
  "/ban-user",
  authenticate,
  injectInternalSecret,
  ipWhitelist,
  checkAdminAuthorization,
  (c) =>
    Request(c, `${process.env.USER_SERVICE_URL}/api/admin/ban-user`, "POST"),
);

router.get(
  "/products/moderation",
  authenticate,
  injectInternalSecret,
  ipWhitelist,
  checkAdminAuthorization,
  (c) => {
    const status = c.req.query("status") || "pending";
    const limit = c.req.query("limit") || "50";
    return Request(
      c,
      `${INVENTORY_BASE}/api/products/moderation?status=${status}&limit=${limit}`,
      "GET",
    );
  },
);

router.patch(
  "/products/:productId/status",
  authenticate,
  injectInternalSecret,
  ipWhitelist,
  checkAdminAuthorization,
  (c) => {
    const productId = c.req.param("productId");
    return Request(
      c,
      `${INVENTORY_BASE}/api/products/${productId}/status`,
      "PATCH",
    );
  },
);

export default router;
