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

// NOTE: the buyer self top-up route (POST /credit) has been removed — wallet
// top-ups are now performed by an admin via POST /api/admin/wallets/credit.

// Loyalty points: summary + history, and redeeming points for wallet credit.
router.get("/points", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me/points`, "GET"),
);

router.post("/points/redeem", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me/points/redeem`, "POST"),
);

router.post("/withdraw", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/me/withdraw`, "POST"),
);

export default router;
