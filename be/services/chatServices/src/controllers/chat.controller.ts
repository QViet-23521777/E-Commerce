import { Context } from "hono";
import {
  listConversations,
  sendMessage,
  listMessages,
  markRead,
} from "../services/chat.service";

/** The gateway forwards the authenticated user via x-user-id. */
const getUserId = (c: Context): string | null => {
  const id = c.req.header("x-user-id");
  return id && id.trim() ? id : null;
};

export const listConversationsController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const before = c.req.query("before");
    const limitRaw = parseInt(c.req.query("limit") ?? "20", 10);
    const limit = isNaN(limitRaw) || limitRaw < 1 ? 20 : Math.min(limitRaw, 100);
    const result = await listConversations(userId, before, limit);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error("listConversations error:", error);
    return c.json({ success: false, message: "Lỗi khi lấy danh sách hội thoại" }, 500);
  }
};

export const sendMessageController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await sendMessage({
      userId,
      conversationId: body.conversationId,
      shopId: body.shopId,
      shopName: body.shopName,
      shopAvatar: body.shopAvatar,
      buyerName: body.buyerName,
      text: body.text,
      productRef: body.productRef,
    });
    if (!result.ok) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }
    return c.json({
      success: true,
      data: { conversationId: result.conversationId, message: result.message },
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return c.json({ success: false, message: "Lỗi khi gửi tin nhắn" }, 500);
  }
};

export const listMessagesController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const conversationId = c.req.param("id") ?? "";
    const before = c.req.query("before");
    const after = c.req.query("after");
    const limitRaw = parseInt(c.req.query("limit") ?? "40", 10);
    const limit = isNaN(limitRaw) || limitRaw < 1 ? 40 : Math.min(limitRaw, 100);
    const result = await listMessages(userId, conversationId, { before, after, limit });
    if (!result.ok) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }
    return c.json({
      success: true,
      data: result.messages,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error("listMessages error:", error);
    return c.json({ success: false, message: "Lỗi khi lấy tin nhắn" }, 500);
  }
};

export const markReadController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const conversationId = c.req.param("id") ?? "";
    const result = await markRead(userId, conversationId);
    if (!result.ok) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("markRead error:", error);
    return c.json({ success: false, message: "Lỗi khi đánh dấu đã đọc" }, 500);
  }
};
