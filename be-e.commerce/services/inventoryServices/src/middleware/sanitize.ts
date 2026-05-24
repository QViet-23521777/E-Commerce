import { Context, Next } from "hono";

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith("$") && !key.includes("."))
        .map(([key, val]) => [key, sanitizeValue(val)]),
    );
  }
  return value;
};

export const sanitizeRequestBody = async (c: Context, next: Next) => {
  const rawQuery = c.req.query();
  const sanitizedQuery: Record<string, string> = {};

  Object.keys(rawQuery).forEach((key) => {
    if (!key.startsWith("$") && !key.includes(".")) {
      sanitizedQuery[key] = rawQuery[key];
    }
  });

  try {
    const body = await c.req.json();
    const sanitizedBody = sanitizeValue(body);
    c.set("sanitizedBody", sanitizedBody);
  } catch {}

  await next();
};
