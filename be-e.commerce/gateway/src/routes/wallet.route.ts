import { Hono } from "hono";
import { authenticate } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.PAYMENT_SERVICE_URL;

router.post("/", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets`, "POST"),
);

router.get("/", authenticate, (c) => Request(c, `${BASE}/api/wallets`, "GET"));

router.post("/credit", authenticate, (c) =>
  Request(c, `${BASE}/api/wallets/credit`, "POST"),
);

export default router;
