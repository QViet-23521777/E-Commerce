import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.PAYMENT_SERVICE_URL;

router.get("/methods", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/payments/methods`, "GET"),
);

router.post("/momo/create", authenticate, (c) =>
  Request(c, `${BASE}/api/payments/momo/create`, "POST"),
);

router.post("/momo/ipn", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/payments/momo/ipn`, "POST"),
);

router.get("/history", authenticate, (c) =>
  Request(c, `${BASE}/api/payments/history`, "GET"),
);

router.post("/:orderId/sync", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}/sync`, "POST");
});

router.post("/:orderId/refund", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}/refund`, "POST");
});

router.get("/:orderId", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}`, "GET");
});

export default router;
