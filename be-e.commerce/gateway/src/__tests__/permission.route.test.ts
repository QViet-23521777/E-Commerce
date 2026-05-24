import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { createApp } from "../app";

const json = async (res: Response) => {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

test("POST /api/permissions/check rejects missing bearer token", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";

  const app = createApp();
  const res = await app.request("/api/permissions/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: "user_123", action: "admin:users.read" }),
  });

  assert.equal(res.status, 401);
  const body = await json(res);
  assert.equal(body?.success, false);
});

test("POST /api/permissions/check proxies to user service when authenticated", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";

  const token = jwt.sign(
    { userId: "user_123", email: "a@example.com", role: "user" },
    process.env.JWT_SECRET,
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const headerObj: Record<string, string> =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers ?? {});

    assert.equal(String(input), "http://user-service/api/permissions/check");
    assert.equal(init?.method, "POST");
    assert.equal(headerObj["x-internal-secret"], "internal_secret");
    assert.equal(headerObj["content-type"] ?? headerObj["Content-Type"], "application/json");
    assert.equal(
      init?.body,
      JSON.stringify({ userId: "user_123", action: "admin:users.read" }),
    );
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as any;

  try {
    const app = createApp();
    const res = await app.request("/api/permissions/check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ userId: "user_123", action: "admin:users.read" }),
    });

    const body = await json(res);
    assert.equal(res.status, 200, `unexpected status=${res.status}, body=${JSON.stringify(body)}`);
    assert.equal(body?.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
