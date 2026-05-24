import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.PAYMENT_SERVICE_URL;

router.post("/momo/create", authenticate, (c) =>
  Request(c, `${BASE}/api/payments/momo/create`, "POST"),
);

router.post("/momo/ipn", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/payments/momo/ipn`, "POST"),
);

router.post("/wallet/checkout", authenticate, (c) =>
  Request(c, `${BASE}/api/payments/wallet/checkout`, "POST"),
);

router.get("/:orderId", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}`, "GET");
});

export default router;
