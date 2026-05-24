import { Hono } from "hono";
import {
  authenticate,
  checkAdminAuthorization,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";
import { ipWhitelist } from "../middleware/ip.whitelist";
const router = new Hono();

router.post("/login", injectInternalSecret, ipWhitelist, (c) => {
  const targetUrl = `${process.env.USER_SERVICE_URL}/api/admin/login`;
  console.log("🔗 Proxying to:", targetUrl);
  return Request(c, targetUrl, "POST");
});

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

export default router;
