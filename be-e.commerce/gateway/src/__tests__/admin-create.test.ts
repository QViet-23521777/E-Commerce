import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app";

// Three requests max: /api/admin/create is behind the 3-per-hour signupLimiter
// and every request in this file shares one in-memory bucket.

const setEnv = () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";
  process.env.ADMIN_CREATION_CODE = "letmein-code";
};

const stubFetch = () => {
  const calls: Record<string, string>[] = [];
  globalThis.fetch = (async (_input: any, init: any) => {
    calls.push(
      init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers ?? {}),
    );
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }) as any;
  return calls;
};

const create = (headers: Record<string, string>) =>
  createApp().request("/api/admin/create", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ name: "New Admin", email: "new@admin.test" }),
  });

test("valid creation code proxies as an admin identity", async () => {
  setEnv();
  const originalFetch = globalThis.fetch;
  const calls = stubFetch();
  try {
    const res = await create({
      "x-admin-creation-code": "letmein-code",
      "x-user-role": "superadmin", // spoof attempt: must not survive
    });
    assert.equal(res.status, 201);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]["x-user-role"], "admin");
    assert.equal(calls[0]["x-user-id"], "admin-creation-code");
    assert.equal(calls[0]["x-internal-secret"], "internal_secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("wrong creation code is rejected before reaching the service", async () => {
  setEnv();
  const originalFetch = globalThis.fetch;
  const calls = stubFetch();
  try {
    const res = await create({ "x-admin-creation-code": "guess" });
    assert.equal(res.status, 403);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("no code and no token is rejected", async () => {
  setEnv();
  const originalFetch = globalThis.fetch;
  const calls = stubFetch();
  try {
    const res = await create({});
    assert.equal(res.status, 401);
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
