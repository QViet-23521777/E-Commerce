"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../app");
const json = async (res) => {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
};
(0, node_test_1.default)("POST /api/permissions/check rejects missing bearer token", async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.INTERNAL_SECRET = "internal_secret";
    process.env.USER_SERVICE_URL = "http://user-service";
    const app = (0, app_1.createApp)();
    const res = await app.request("/api/permissions/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "user_123", action: "admin:users.read" }),
    });
    strict_1.default.equal(res.status, 401);
    const body = await json(res);
    strict_1.default.equal(body?.success, false);
});
(0, node_test_1.default)("POST /api/permissions/check proxies to user service when authenticated", async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.INTERNAL_SECRET = "internal_secret";
    process.env.USER_SERVICE_URL = "http://user-service";
    const token = jsonwebtoken_1.default.sign({ userId: "user_123", email: "a@example.com", role: "user" }, process.env.JWT_SECRET);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input, init) => {
        const headerObj = init?.headers instanceof Headers
            ? Object.fromEntries(init.headers.entries())
            : (init?.headers ?? {});
        strict_1.default.equal(String(input), "http://user-service/api/permissions/check");
        strict_1.default.equal(init?.method, "POST");
        strict_1.default.equal(headerObj["x-internal-secret"], "internal_secret");
        strict_1.default.equal(headerObj["content-type"] ?? headerObj["Content-Type"], "application/json");
        strict_1.default.equal(init?.body, JSON.stringify({ userId: "user_123", action: "admin:users.read" }));
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    });
    try {
        const app = (0, app_1.createApp)();
        const res = await app.request("/api/permissions/check", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ userId: "user_123", action: "admin:users.read" }),
        });
        const body = await json(res);
        strict_1.default.equal(res.status, 200, `unexpected status=${res.status}, body=${JSON.stringify(body)}`);
        strict_1.default.equal(body?.success, true);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
