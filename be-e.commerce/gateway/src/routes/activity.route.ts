import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware";
import { Request } from "../utils/proxy";

const router = new Hono();
const BASE = process.env.ACTIVITY_SERVICE_URL;

router.post("/", authenticate, (c) =>
  Request(c, `${BASE}/api/activities`, "POST"),
);

router.post("/flush/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/activities/flush/${userId}`, "POST");
});

router.get("/queue/:userId", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/activities/queue/${userId}`, "GET");
});

router.get("/history/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/activities/history/${userId}`, "GET");
});

router.get("/recent/:userId", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/activities/recent/${userId}`, "GET");
});

router.delete("/queue/:userId", authenticate, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/activities/queue/${userId}`, "DELETE");
});

export default router;
