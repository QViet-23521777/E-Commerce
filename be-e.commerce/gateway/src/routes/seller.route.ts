import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.USER_SERVICE_URL;

router.post("/create", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/sellers/create`, "POST"),
);

router.post("/verify", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/sellers/verify`, "POST"),
);

router.get("/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/sellers/${userId}`, "GET");
});

router.put("/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/sellers/${userId}`, "PUT");
});

router.delete("/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/sellers/${userId}`, "DELETE");
});

export default router;

