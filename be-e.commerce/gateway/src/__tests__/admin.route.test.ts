import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { createApp } from "../app";

const json = async (res: Response) => {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

test("POST /api/admin/login proxies without bearer token", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const headerObj: Record<string, string> =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers ?? {});

    assert.equal(String(input), "http://user-service/api/admin/login");
    assert.equal(init?.method, "POST");
    assert.equal(headerObj["x-internal-secret"], "internal_secret");
    assert.equal(
      headerObj["content-type"] ?? headerObj["Content-Type"],
      "application/json",
    );
    return new Response(JSON.stringify({ success: true, token: "admin-jwt" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as any;

  try {
    const app = createApp();
    const res = await app.request("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "P@ssw0rd123",
        token: "invite-token",
      }),
    });
    assert.equal(res.status, 200);
    const body = await json(res);
    assert.equal(body?.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("POST /api/admin/create rejects non-admin role", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";

  const token = jwt.sign(
    { userId: "user_123", email: "a@example.com", role: "user" },
    process.env.JWT_SECRET,
  );

  const app = createApp();
  const res = await app.request("/api/admin/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ name: "Admin A", email: "admin@example.com" }),
  });

  assert.equal(res.status, 403);
  const body = await json(res);
  assert.equal(body?.success, false);
});

test("POST /api/admin/create proxies when admin role", async () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";

  const token = jwt.sign(
    { userId: "admin_1", email: "admin@example.com", role: "admin" },
    process.env.JWT_SECRET,
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const headerObj: Record<string, string> =
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers ?? {});

    assert.equal(String(input), "http://user-service/api/admin/create");
    assert.equal(init?.method, "POST");
    assert.equal(headerObj["x-internal-secret"], "internal_secret");
    assert.equal(headerObj["x-user-id"], "admin_1");
    assert.equal(headerObj["x-user-email"], "admin@example.com");
    assert.equal(headerObj["x-user-role"], "admin");
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }) as any;

  try {
    const app = createApp();
    const res = await app.request("/api/admin/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: "Admin A", email: "admin@example.com" }),
    });

    const body = await json(res);
    assert.equal(
      res.status,
      201,
      `unexpected status=${res.status}, body=${JSON.stringify(body)}`,
    );
    assert.equal(body?.success, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

