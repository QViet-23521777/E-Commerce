import test from "node:test";
import assert from "node:assert/strict";
import { Hono } from "hono";

import adminRoutes from "../routes/admin.routes";

const mount = () => {
  process.env.INTERNAL_SECRET = "internal_secret";
  const app = new Hono();
  app.route("/api/admin", adminRoutes);
  return app;
};

test("rejects a request with no internal secret", async () => {
  const res = await mount().request("/api/admin/users");
  assert.equal(res.status, 403);
});

test("rejects a request with a wrong internal secret", async () => {
  const res = await mount().request("/api/admin/users", {
    headers: { "x-internal-secret": "not-the-secret" },
  });
  assert.equal(res.status, 403);
});

test("rejects an internal request carrying no user identity", async () => {
  const res = await mount().request("/api/admin/users", {
    headers: { "x-internal-secret": "internal_secret" },
  });
  assert.equal(res.status, 401);
});

test("rejects an internal request from a non-admin role", async () => {
  const res = await mount().request("/api/admin/users", {
    headers: {
      "x-internal-secret": "internal_secret",
      "x-user-id": "user_1",
      "x-user-role": "user",
    },
  });
  assert.equal(res.status, 403);
});

test("rejects admin creation from a non-admin role", async () => {
  const res = await mount().request("/api/admin/create", {
    method: "POST",
    headers: {
      "x-internal-secret": "internal_secret",
      "x-user-id": "user_1",
      "x-user-role": "user",
      "content-type": "application/json",
    },
    body: JSON.stringify({ name: "Mallory", email: "mallory@evil.test" }),
  });
  assert.equal(res.status, 403);
});

test("still allows unauthenticated admin login through the gate", async () => {
  // /login is pre-auth by design — it must survive internalAuth but must not
  // require a user identity. A non-403 status proves it reached the handler.
  const res = await mount().request("/api/admin/login", {
    method: "POST",
    headers: {
      "x-internal-secret": "internal_secret",
      "content-type": "application/json",
    },
    body: JSON.stringify({ email: "admin@example.com", password: "wrong" }),
  });
  assert.notEqual(res.status, 403);
});
