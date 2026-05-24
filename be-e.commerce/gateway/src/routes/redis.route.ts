import { Hono } from "hono";
import { injectInternalSecret } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;

router.get("/recommendations/:userId", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/redis/recommendations/${userId}`, "GET");
});

router.get("/recommendations-recent/:userId", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/redis/recommendations-recent/${userId}`, "GET");
});

router.post("/recommendations/:userId", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/redis/recommendations/${userId}`, "POST");
});

export default router;

