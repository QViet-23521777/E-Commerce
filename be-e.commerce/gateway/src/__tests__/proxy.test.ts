import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app";

const setEnv = () => {
  process.env.JWT_SECRET = "test_secret";
  process.env.INTERNAL_SECRET = "internal_secret";
  process.env.USER_SERVICE_URL = "http://user-service";
  process.env.ALLOWED_ORIGINS = "http://localhost:3100";
};

test("returns a generic 502 without leaking upstream error detail", async () => {
  setEnv();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("connect ECONNREFUSED 172.18.0.5:3001");
  }) as any;

  try {
    const app = createApp();
    const res = await app.request("/api/users/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c", password: "x" }),
    });

    assert.equal(res.status, 502);
    const body = await res.text();
    assert.ok(
      !body.includes("ECONNREFUSED"),
      `error detail leaked to client: ${body}`,
    );
    assert.ok(!body.includes("172.18.0.5"), `internal IP leaked: ${body}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("passes an abort signal to the upstream fetch", async () => {
  setEnv();

  const originalFetch = globalThis.fetch;
  let sawSignal = false;

  globalThis.fetch = (async (_input: any, init: any) => {
    sawSignal = Boolean(init?.signal);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as any;

  try {
    const app = createApp();
    await app.request("/api/users/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c", password: "x" }),
    });
    assert.ok(sawSignal, "expected proxy to pass an AbortSignal upstream");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("oversized chunked body gets 413, not a proxy error", async () => {
  setEnv();

  const originalFetch = globalThis.fetch;
  let upstreamCalled = false;
  globalThis.fetch = (async () => {
    upstreamCalled = true;
    return new Response("{}", { status: 200 });
  }) as any;

  try {
    const app = createApp();
    // No content-length: bodyLimit has to count the stream as it is read.
    const res = await app.request("/api/users/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: new Blob([new Uint8Array(11 * 1024 * 1024)]).stream(),
      duplex: "half",
    } as any);

    assert.equal(res.status, 413);
    assert.equal(upstreamCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
