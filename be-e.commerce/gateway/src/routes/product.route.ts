import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
  checkAdminAuthorization,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;

router.get("/search", injectInternalSecret, (c) => {
  // Forward the full query string so storefront filters (type, price range,
  // rating, in-stock, sort, page) all reach the inventory service intact.
  const search = new URL(c.req.url).search; // includes leading "?" or ""
  return Request(c, `${BASE}/api/products/search${search}`, "GET");
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

router.post("/:productId/reviews", authenticate, (c) => {
  const productId = c.req.param("productId");
  return Request(c, `${BASE}/api/products/${productId}/reviews`, "POST");
});

// ── Review replies & moderation ──────────────────────────────────────────────
// Seller's own product reviews (seller identity = x-user-id, forwarded).
router.get("/reviews/seller", authenticate, (c) =>
  Request(c, `${BASE}/api/products/reviews/seller`, "GET"),
);
// Admin moderation queue.
router.get("/reviews/reported", authenticate, checkAdminAuthorization, (c) =>
  Request(c, `${BASE}/api/products/reviews/reported`, "GET"),
);
// Seller replies to a review on one of their products.
router.post("/:productId/reviews/:index/reply", authenticate, (c) => {
  const { productId, index } = c.req.param();
  return Request(
    c,
    `${BASE}/api/products/${productId}/reviews/${index}/reply`,
    "POST",
  );
});
// Admin hides/unhides a review.
router.patch(
  "/:productId/reviews/:index/moderate",
  authenticate,
  checkAdminAuthorization,
  (c) => {
    const { productId, index } = c.req.param();
    return Request(
      c,
      `${BASE}/api/products/${productId}/reviews/${index}/moderate`,
      "PATCH",
    );
  },
);
// Any signed-in buyer flags a review for moderation.
router.post("/:productId/reviews/:index/report", authenticate, (c) => {
  const { productId, index } = c.req.param();
  return Request(
    c,
    `${BASE}/api/products/${productId}/reviews/${index}/report`,
    "POST",
  );
});

router.get("/:productId", injectInternalSecret, (c) => {
  const productId = c.req.param("productId");
  return Request(c, `${BASE}/api/products/${productId}`, "GET");
});

export default router;
