import { Hono } from "hono";
import { authenticate } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.CART_SERVICE_URL;

router.get("/", authenticate, (c) => Request(c, `${BASE}/api/cart`, "GET"));

router.put("/", authenticate, (c) => Request(c, `${BASE}/api/cart`, "PUT"));

router.delete("/", authenticate, (c) => Request(c, `${BASE}/api/cart`, "DELETE"));

router.post("/merge", authenticate, (c) =>
  Request(c, `${BASE}/api/cart/merge`, "POST"),
);

router.post("/orders/:orderId/snapshot", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/cart/orders/${orderId}/snapshot`, "POST");
});

router.get("/orders/:orderId/snapshot", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/cart/orders/${orderId}/snapshot`, "GET");
});

export default router;
