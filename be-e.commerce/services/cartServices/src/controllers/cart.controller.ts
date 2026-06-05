import { Context } from "hono";
import {
  getCart,
  replaceCart,
  clearCart,
  mergeCart,
  saveSnapshot,
  getSnapshot,
} from "../services/cart.services";

/** The gateway forwards the authenticated user via x-user-id. */
const getUserId = (c: Context): string | null => {
  const id = c.req.header("x-user-id");
  return id && id.trim() ? id : null;
};

export const getCartController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const data = await getCart(userId);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("getCart error:", error);
    return c.json({ success: false, message: "Lỗi khi lấy giỏ hàng" }, 500);
  }
};

export const replaceCartController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const body = await c.req.json().catch(() => ({}));
    const data = await replaceCart(userId, body.items, body.couponCode);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("replaceCart error:", error);
    return c.json({ success: false, message: "Lỗi khi lưu giỏ hàng" }, 500);
  }
};

export const clearCartController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const data = await clearCart(userId);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("clearCart error:", error);
    return c.json({ success: false, message: "Lỗi khi xóa giỏ hàng" }, 500);
  }
};

export const mergeCartController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const body = await c.req.json().catch(() => ({}));
    const data = await mergeCart(userId, body.items, body.couponCode);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("mergeCart error:", error);
    return c.json({ success: false, message: "Lỗi khi hợp nhất giỏ hàng" }, 500);
  }
};

export const saveSnapshotController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const orderId = c.req.param("orderId") ?? "";
    const body = await c.req.json().catch(() => ({}));
    const data = await saveSnapshot(userId, { ...body, orderId });
    if (!data) return c.json({ success: false, message: "orderId là bắt buộc" }, 400);
    return c.json({ success: true });
  } catch (error) {
    console.error("saveSnapshot error:", error);
    return c.json({ success: false, message: "Lỗi khi lưu đơn hàng" }, 500);
  }
};

export const getSnapshotController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const orderId = c.req.param("orderId") ?? "";
    const data = await getSnapshot(userId, orderId);
    if (!data) return c.json({ success: false, message: "Không tìm thấy đơn hàng" }, 404);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("getSnapshot error:", error);
    return c.json({ success: false, message: "Lỗi khi lấy đơn hàng" }, 500);
  }
};
