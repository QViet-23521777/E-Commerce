import { Hono } from "hono";
import { authenticate } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();

router.post("/check", authenticate, (c) =>
  Request(c, `${process.env.USER_SERVICE_URL}/api/permissions/check`, "POST"),
);

export default router;
