import { Context } from "hono";
import { checkPermission } from "../services/action.permision.services";

const HTTP_STATUS: Record<string, number> = {
  USER_NOT_FOUND: 404,
  PERMISSION_DENIED: 403,
};

function handleError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = HTTP_STATUS[message] ?? 500;
  return c.json({ success: false, message }, status as any);
}

export const checkActionPermission = async (c: Context) => {
  try {
    const { userId, action } = await c.req.json();
    const hasPermission = await checkPermission(userId, action);
    if (!hasPermission) {
      return c.json({ success: false, message: "Permission denied" }, 403);
    }
    return c.json({ success: true, message: "Permission granted" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};
