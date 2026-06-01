import { Hono } from "hono";
import { authenticate } from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.CHAT_SERVICE_URL;

router.get("/conversations", authenticate, (c) =>
  Request(c, `${BASE}/api/chat/conversations`, "GET"),
);

router.get("/conversations/:id/messages", authenticate, (c) => {
  const id = c.req.param("id");
  const after = c.req.query("after");
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  return Request(c, `${BASE}/api/chat/conversations/${id}/messages${qs}`, "GET");
});

router.post("/conversations/:id/read", authenticate, (c) => {
  const id = c.req.param("id");
  return Request(c, `${BASE}/api/chat/conversations/${id}/read`, "POST");
});

router.post("/messages", authenticate, (c) =>
  Request(c, `${BASE}/api/chat/messages`, "POST"),
);

export default router;
