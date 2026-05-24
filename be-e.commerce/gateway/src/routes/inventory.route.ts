import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;

router.post("/", authenticate, (c) =>
  Request(c, `${BASE}/api/inventory`, "POST"),
);

router.get("/seller/:sellerId", authenticate, (c) => {
  const sellerId = c.req.param("sellerId");
  return Request(c, `${BASE}/api/inventory/seller/${sellerId}`, "GET");
});

router.get("/search", injectInternalSecret, (c) => {
  const name = c.req.query("name") ?? "";
  return Request(c, `${BASE}/api/inventory/search?name=${name}`, "GET");
});

router.get("/:inventoryId", authenticate, (c) => {
  const inventoryId = c.req.param("inventoryId");
  return Request(c, `${BASE}/api/inventory/${inventoryId}`, "GET");
});

router.put("/:inventoryId/quantity", authenticate, (c) => {
  const inventoryId = c.req.param("inventoryId");
  return Request(c, `${BASE}/api/inventory/${inventoryId}/quantity`, "PUT");
});

router.post("/:inventoryId/buy", authenticate, (c) => {
  const inventoryId = c.req.param("inventoryId");
  return Request(c, `${BASE}/api/inventory/${inventoryId}/buy`, "POST");
});

router.post("/buy/batch", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/inventory/buy/batch`, "POST"),
);

router.post("/check", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/inventory/check`, "POST"),
);

router.post("/:inventoryId/restore", injectInternalSecret, (c) => {
  const inventoryId = c.req.param("inventoryId");
  return Request(c, `${BASE}/api/inventory/${inventoryId}/restore`, "POST");
});

router.post("/restore/batch", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/inventory/restore/batch`, "POST"),
);

router.delete("/:inventoryId", authenticate, (c) => {
  const inventoryId = c.req.param("inventoryId");
  return Request(c, `${BASE}/api/inventory/${inventoryId}`, "DELETE");
});

export default router;

