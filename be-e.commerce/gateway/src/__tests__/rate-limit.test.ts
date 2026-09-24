import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app";

test("blocks repeated login attempts after the limit", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";
  process.env.ALLOWED_ORIGINS = "http://localhost:3100";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ success: false }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })) as any;

  try {
    const app = createApp();
    const attempt = () =>
      app.request("/api/users/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@b.c", password: "wrong" }),
      });

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await attempt()).status);
    }

    assert.ok(
      statuses.includes(429),
      `expected a 429 within 7 attempts, got ${statuses.join(",")}`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
