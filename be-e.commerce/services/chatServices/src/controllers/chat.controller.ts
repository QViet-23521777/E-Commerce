import { Context } from "hono";
import {
  listConversations,
  sendMessage,
  listMessages,
  markRead,
} from "../services/chat.services";

/** The gateway forwards the authenticated user via x-user-id. */
const getUserId = (c: Context): string | null => {
  const id = c.req.header("x-user-id");
  return id && id.trim() ? id : null;
};

export const listConversationsController = async (c: Context) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const data = await listConversations(userId);
    return c.json({ success: true, data });
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
    const after = c.req.query("after");
    const result = await listMessages(userId, conversationId, after);
    if (!result.ok) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }
    return c.json({ success: true, data: result.messages });
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
