import { Hono } from "hono";
import {
  authenticate,
  injectInternalSecret,
} from "../middleware/authMiddleware.js";
import { Request } from "../utils/proxy.js";

const router = new Hono();
const BASE = process.env.USER_SERVICE_URL;

router.post("/register", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/register`, "POST"),
);
router.post("/login", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/login`, "POST"),
);
router.post("/refresh-token", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/refresh-token`, "POST"),
);
router.get("/verify-email", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/verify-email`, "GET"),
);
router.post("/send-reset-password-email", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/send-reset-password-email`, "POST"),
);
router.post("/verify-resetpassword", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/verify-resetpassword`, "POST"),
);
router.post("/change-password", injectInternalSecret, (c) =>
  Request(c, `${BASE}/api/users/change-password`, "POST"),
);

router.post("/logout", authenticate, (c) =>
  Request(c, `${BASE}/api/users/logout`, "POST"),
);
router.get("/profile", authenticate, (c) =>
  Request(c, `${BASE}/api/users/profile`, "GET"),
);
router.get("/profile/:id", authenticate, (c) => {
  const id = c.req.param("id");
  return Request(c, `${BASE}/api/users/profile/${id}`, "GET");
});
router.put("/profile", authenticate, (c) =>
  Request(c, `${BASE}/api/users/profile`, "PUT"),
);
router.delete("/profile", authenticate, (c) =>
  Request(c, `${BASE}/api/users/profile`, "DELETE"),
);

export default router;
