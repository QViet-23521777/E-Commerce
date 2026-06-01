import { Hono } from "hono";
import {
  authenticate,
  authorize,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.PROMOTION_SERVICE_URL;

router.get("/", authenticate, authorize("admin"), (c) =>
  Request(c, `${BASE}/api/promotions`, "GET"),
);

router.get("/active", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/promotions/active`, "GET"),
);

router.get("/code/:code", injectInternalSecret, (c) => {
  const code = c.req.param("code");
  return Request(c, `${BASE}/api/promotions/code/${code}`, "GET");
});

router.post("/validate", authenticate, (c) =>
  Request(c, `${BASE}/api/promotions/validate`, "POST"),
);

router.post("/redeem", authenticate, (c) =>
  Request(c, `${BASE}/api/promotions/redeem`, "POST"),
);

router.post("/", authenticate, authorize("admin"), (c) =>
  Request(c, `${BASE}/api/promotions`, "POST"),
);

router.get("/:promotionId", authenticate, authorize("admin"), (c) => {
  const promotionId = c.req.param("promotionId");
  return Request(c, `${BASE}/api/promotions/${promotionId}`, "GET");
});

router.patch("/:promotionId", authenticate, authorize("admin"), (c) => {
  const promotionId = c.req.param("promotionId");
  return Request(c, `${BASE}/api/promotions/${promotionId}`, "PATCH");
});

router.delete("/:promotionId", authenticate, authorize("admin"), (c) => {
  const promotionId = c.req.param("promotionId");
  return Request(c, `${BASE}/api/promotions/${promotionId}`, "DELETE");
});

export default router;
