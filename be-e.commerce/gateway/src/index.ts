import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authenticate } from "./middleware/authMiddleware";
import "dotenv/config";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

// Register
app.post("/api/users/register", async (c) => {
  try {
    const body = await c.req.json();

    const response = await fetch(
      `${process.env.USER_SERVICE_URL}/api/users/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Login
app.post("/api/users/login", async (c) => {
  try {
    const body = await c.req.json();

    const response = await fetch(
      `${process.env.USER_SERVICE_URL}/api/users/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Refresh Token
app.post("/api/users/refresh-token", async (c) => {
  try {
    const body = await c.req.json();

    const response = await fetch(
      `${process.env.USER_SERVICE_URL}/api/users/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Logout (Protected)
app.post("/api/users/logout", authenticate, async (c) => {
  try {
    const body = await c.req.json();

    const response = await fetch(
      `${process.env.USER_SERVICE_URL}/api/users/logout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
});

console.log(`Gateway running on port ${port}`);
