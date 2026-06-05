import { Hono } from "hono";
import {
  authenticate,
  checkAdminAuthorization,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.SUPPORT_SERVICE_URL;

// ── Feedback ─────────────────────────────────────────────────────────────────
// Any authenticated user can submit; only admins can list / triage.
router.post("/feedback", authenticate, (c) =>
  Request(c, `${BASE}/api/support/feedback`, "POST"),
);
router.get("/feedback", authenticate, checkAdminAuthorization, (c) => {
  const status = c.req.query("status");
  const qs = status ? `?status=${status}` : "";
  return Request(c, `${BASE}/api/support/feedback${qs}`, "GET");
});
router.patch("/feedback/:id", authenticate, checkAdminAuthorization, (c) => {
  const id = c.req.param("id");
  return Request(c, `${BASE}/api/support/feedback/${id}`, "PATCH");
});

// ── Categories ───────────────────────────────────────────────────────────────
// Public read (storefront + guests); admin-only writes.
router.get("/categories", (c) =>
  Request(c, `${BASE}/api/support/categories`, "GET"),
);
router.post("/categories", authenticate, checkAdminAuthorization, (c) =>
  Request(c, `${BASE}/api/support/categories`, "POST"),
);
router.patch("/categories/:id", authenticate, checkAdminAuthorization, (c) => {
  const id = c.req.param("id");
  return Request(c, `${BASE}/api/support/categories/${id}`, "PATCH");
});
router.delete("/categories/:id", authenticate, checkAdminAuthorization, (c) => {
  const id = c.req.param("id");
  return Request(c, `${BASE}/api/support/categories/${id}`, "DELETE");
});

// ── Seller bank profile ──────────────────────────────────────────────────────
// Seller-scoped; the service keys off the forwarded x-user-id.
router.get("/seller/bank", authenticate, (c) =>
  Request(c, `${BASE}/api/support/seller/bank`, "GET"),
);
router.put("/seller/bank", authenticate, (c) =>
  Request(c, `${BASE}/api/support/seller/bank`, "PUT"),
);

export default router;
