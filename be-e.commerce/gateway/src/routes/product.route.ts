import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;

router.get("/search", injectInternalSecret, (c) => {
  const q = c.req.query("q");
  const limit = c.req.query("limit");
  return Request(c, `${BASE}/api/products/search?q=${q}&limit=${limit}`, "GET");
});

router.get("/top/purchases", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/products/top/purchases`, "GET"),
);
router.get("/top/sale", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/products/top/sale`, "GET"),
);
router.get("/top/point", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/products/top/point`, "GET"),
);
router.get("/top/list-type", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/products/top/list-type`, "GET"),
);
router.get("/top/type/:type", injectInternalSecret, (c) => {
  const type = c.req.param("type");
  return Request(c, `${BASE}/api/products/top/type/${type}`, "GET");
});

router.post("/recommend", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/products/recommend`, "POST"),
);

router.post("/recommend/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/products/recommend/${userId}`, "POST");
});

router.post("/", authenticate, (c) =>
  Request(c, `${BASE}/api/products`, "POST"),
);

router.get("/:productId", injectInternalSecret, (c) => {
  const productId = c.req.param("productId");
  return Request(c, `${BASE}/api/products/${productId}`, "GET");
});

export default router;
