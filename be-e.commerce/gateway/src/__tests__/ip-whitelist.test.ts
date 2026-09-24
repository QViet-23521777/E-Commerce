import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import { ipWhitelist } from "../middleware/ip.whitelist";

const guarded = () => {
  const app = new Hono();
  app.use("/guarded", ipWhitelist);
  app.get("/guarded", (c) => c.json({ ok: true }));
  return app;
};

test("does not trust a client-supplied X-Forwarded-For", async () => {
  process.env.ADMIN_ALLOWED_IPS = "127.0.0.1,::1";

  const res = await guarded().request("/guarded", {
    headers: { "x-forwarded-for": "127.0.0.1" },
  });

  assert.equal(
    res.status,
    403,
    "spoofed X-Forwarded-For was accepted as the client IP",
  );
});

test("does not trust a client-supplied X-Real-IP", async () => {
  process.env.ADMIN_ALLOWED_IPS = "127.0.0.1,::1";

  const res = await guarded().request("/guarded", {
    headers: { "x-real-ip": "127.0.0.1" },
  });

  assert.equal(res.status, 403, "spoofed X-Real-IP was accepted as the client IP");
});

test("fails closed when ADMIN_ALLOWED_IPS is empty", async () => {
  process.env.ADMIN_ALLOWED_IPS = "";

  const res = await guarded().request("/guarded");

  assert.equal(res.status, 403);
});
