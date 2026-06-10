"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const Request = async (c, url, method = "POST") => {
    try {
        const isBodyMethod = ["POST", "PUT", "PATCH"].includes(method);
        let body = undefined;
        if (isBodyMethod) {
            const cloned = c.req.raw.clone();
            const text = await cloned.text();
            body = text.trim() ? text : undefined;
        }
        const targetUrl = url;
        const headers = {
            "x-internal-secret": process.env.INTERNAL_SECRET,
        };
        const contentType = c.req.header("content-type");
        if (contentType)
            headers["Content-Type"] = contentType;
        const userId = c.req.header("x-user-id");
        const userEmail = c.req.header("x-user-email");
        const userRole = c.req.header("x-user-role");
        const clientIP = c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
            c.req.header("x-real-ip") ||
            c.env?.remoteAddr ||
            c.req.raw.headers.get("x-forwarded-for") ||
            "";
        if (clientIP)
            headers["x-forwarded-for"] = clientIP;
        if (userId)
            headers["x-user-id"] = userId;
        if (userEmail)
            headers["x-user-email"] = userEmail;
        if (userRole)
            headers["x-user-role"] = userRole;
        const response = await fetch(targetUrl, { method, headers, body });
        if (response.status === 204) {
            return new Response(null, { status: 204 });
        }
        const responseType = response.headers.get("content-type") || "";
        if (responseType.includes("application/json")) {
            const data = await response.json();
            return c.json(data, response.status);
        }
        const text = await response.text();
        return c.body(text, response.status, responseType ? { "Content-Type": responseType } : undefined);
    }
    catch (error) {
        return c.json({ success: false, message: error.message }, 500);
    }
};
exports.Request = Request;
