import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app";

const setEnv = () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";
  process.env.ALLOWED_ORIGINS = "http://localhost:3100";
};

test("strips client-supplied identity headers before proxying", async () => {
  setEnv();

  const originalFetch = globalThis.fetch;
  let forwarded: Record<string, string> = {};

  globalThis.fetch = (async (_input: any, init: any) => {
    forwarded =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers ?? {});
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as any;

  try {
    const app = createApp();
    await app.request("/api/users/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "attacker",
        "x-user-email": "attacker@evil.test",
        "x-user-role": "superadmin",
      },
      body: JSON.stringify({ email: "a@b.c", password: "irrelevant" }),
    });

    assert.equal(forwarded["x-user-id"], undefined);
    assert.equal(forwarded["x-user-email"], undefined);
    assert.equal(forwarded["x-user-role"], undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sets security headers on every response", async () => {
  setEnv();
  const app = createApp();
  const res = await app.request("/health");

  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.ok(res.headers.get("x-frame-options"), "expected X-Frame-Options");
  assert.ok(
    res.headers.get("strict-transport-security"),
    "expected Strict-Transport-Security",
  );
});

test("allows the configured frontend origin", async () => {
  setEnv();
  const app = createApp();
  const res = await app.request("/health", {
    headers: { Origin: "http://localhost:3100" },
  });

  assert.equal(
    res.headers.get("access-control-allow-origin"),
    "http://localhost:3100",
  );
});

test("does not echo an unlisted origin", async () => {
  setEnv();
  const app = createApp();
  const res = await app.request("/health", {
    headers: { Origin: "http://evil.test" },
  });

  assert.notEqual(res.headers.get("access-control-allow-origin"), "*");
  assert.notEqual(res.headers.get("access-control-allow-origin"), "http://evil.test");
});
