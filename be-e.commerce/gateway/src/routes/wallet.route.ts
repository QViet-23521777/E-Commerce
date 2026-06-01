import { Hono } from "hono";
import { authenticate } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.PAYMENT_SERVICE_URL;

// The payment service exposes the caller's wallet under /me (it derives the
// user from the forwarded x-user-id header). Reading it upserts a wallet, so a
// dedicated "create" is unnecessary — POST "/" maps to the same read.
router.post("/", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me`, "GET"),
);

router.get("/", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me`, "GET"),
);

router.post("/credit", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me/credit`, "POST"),
);

export default router;
