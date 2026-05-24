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
(0, node_test_1.default)("POST /api/admin/login proxies without bearer token", async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.INTERNAL_SECRET = "internal_secret";
    process.env.USER_SERVICE_URL = "http://user-service";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input, init) => {
        const headerObj = init?.headers instanceof Headers
            ? Object.fromEntries(init.headers.entries())
            : (init?.headers ?? {});
        strict_1.default.equal(String(input), "http://user-service/api/admin/login");
        strict_1.default.equal(init?.method, "POST");
        strict_1.default.equal(headerObj["x-internal-secret"], "internal_secret");
        strict_1.default.equal(headerObj["content-type"] ?? headerObj["Content-Type"], "application/json");
        return new Response(JSON.stringify({ success: true, token: "admin-jwt" }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    });
    try {
        const app = (0, app_1.createApp)();
        const res = await app.request("/api/admin/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                email: "admin@example.com",
                password: "P@ssw0rd123",
                token: "invite-token",
            }),
        });
        strict_1.default.equal(res.status, 200);
        const body = await json(res);
        strict_1.default.equal(body?.success, true);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
(0, node_test_1.default)("POST /api/admin/create rejects non-admin role", async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.INTERNAL_SECRET = "internal_secret";
    process.env.USER_SERVICE_URL = "http://user-service";
    const token = jsonwebtoken_1.default.sign({ userId: "user_123", email: "a@example.com", role: "user" }, process.env.JWT_SECRET);
    const app = (0, app_1.createApp)();
    const res = await app.request("/api/admin/create", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Admin A", email: "admin@example.com" }),
    });
    strict_1.default.equal(res.status, 403);
    const body = await json(res);
    strict_1.default.equal(body?.success, false);
});
(0, node_test_1.default)("POST /api/admin/create proxies when admin role", async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.INTERNAL_SECRET = "internal_secret";
    process.env.USER_SERVICE_URL = "http://user-service";
    const token = jsonwebtoken_1.default.sign({ userId: "admin_1", email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input, init) => {
        const headerObj = init?.headers instanceof Headers
            ? Object.fromEntries(init.headers.entries())
            : (init?.headers ?? {});
        strict_1.default.equal(String(input), "http://user-service/api/admin/create");
        strict_1.default.equal(init?.method, "POST");
        strict_1.default.equal(headerObj["x-internal-secret"], "internal_secret");
        strict_1.default.equal(headerObj["x-user-id"], "admin_1");
        strict_1.default.equal(headerObj["x-user-email"], "admin@example.com");
        strict_1.default.equal(headerObj["x-user-role"], "admin");
        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "content-type": "application/json" },
        });
    });
    try {
        const app = (0, app_1.createApp)();
        const res = await app.request("/api/admin/create", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ name: "Admin A", email: "admin@example.com" }),
        });
        const body = await json(res);
        strict_1.default.equal(res.status, 201, `unexpected status=${res.status}, body=${JSON.stringify(body)}`);
        strict_1.default.equal(body?.success, true);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
