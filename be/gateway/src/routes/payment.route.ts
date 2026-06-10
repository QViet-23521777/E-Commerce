import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/auth.middleware";
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

// Orders — specific paths registered BEFORE the "/:orderId" catch-all.
// `Request` does not forward the query string, so append it manually.
router.get("/", authenticate, (c) => {
  const qs = new URL(c.req.url).search;
  return Request(c, `${BASE}/api/payments${qs}`, "GET");
});

router.get("/seller", authenticate, (c) => {
  const qs = new URL(c.req.url).search;
  return Request(c, `${BASE}/api/payments/seller${qs}`, "GET");
});

router.patch("/:orderId/fulfillment", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(
    c,
    `${BASE}/api/payments/${orderId}/fulfillment`,
    "PATCH",
  );
});

router.post("/:orderId/cancel", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}/cancel`, "POST");
});

router.get("/:orderId", authenticate, (c) => {
  const orderId = c.req.param("orderId");
  return Request(c, `${BASE}/api/payments/${orderId}`, "GET");
});

export default router;
