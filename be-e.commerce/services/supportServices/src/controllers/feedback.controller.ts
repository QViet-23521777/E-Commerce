import { Context } from "hono";
import {
  createFeedback,
  listFeedback,
  updateFeedback,
} from "../services/feedback.services";

const userId = (c: Context) => c.req.header("x-user-id") || null;
const isAdmin = (c: Context) => {
  const role = c.req.header("x-user-role");
  return role === "admin" || role === "superadmin";
};

export const createFeedbackController = async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    // Fall back to the authenticated identity forwarded by the gateway.
    const email = c.req.header("x-user-email");
    if (!body.email && email) body.email = email;
    if (!body.author && email) body.author = email;
    const data = await createFeedback(userId(c), body);
    if (!data) {
      return c.json({ success: false, message: "subject và message là bắt buộc" }, 400);
    }
    return c.json({ success: true, data }, 201);
  } catch (error) {
    console.error("createFeedback error:", error);
    return c.json({ success: false, message: "Lỗi khi gửi phản hồi" }, 500);
  }
};

export const listFeedbackController = async (c: Context) => {
  if (!isAdmin(c)) return c.json({ success: false, message: "Forbidden" }, 403);
  try {
    const status = c.req.query("status") || undefined;
    const data = await listFeedback(status);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("listFeedback error:", error);
    return c.json({ success: false, message: "Lỗi khi tải phản hồi" }, 500);
  }
};

export const updateFeedbackController = async (c: Context) => {
  if (!isAdmin(c)) return c.json({ success: false, message: "Forbidden" }, 403);
  try {
    const id = c.req.param("id") || "";
    const body = await c.req.json().catch(() => ({}));
    const data = await updateFeedback(id, body);
    if (!data) return c.json({ success: false, message: "Không tìm thấy phản hồi" }, 404);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("updateFeedback error:", error);
    return c.json({ success: false, message: "Lỗi khi cập nhật phản hồi" }, 500);
  }
};
