import { Types } from "mongoose";
import { Conversation, SenderRole } from "../models/conversation.model";
import { Message, IProductRef } from "../models/message.model";

const PREVIEW_LEN = 120;

export type ConversationView = {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatar: string;
  lastMessage: string;
  lastSenderRole: SenderRole;
  lastMessageAt: Date;
  unread: number;
  perspective: SenderRole;
};

export type MessageView = {
  id: string;
  senderRole: SenderRole;
  text: string;
  productRef?: IProductRef;
  createdAt: Date;
};

const sideOf = (conv: { buyerId: string; shopId: string }, userId: string): SenderRole | null => {
  if (conv.buyerId === userId) return "buyer";
  if (conv.shopId === userId) return "shop";
  return null;
};

const toMessageView = (m: any): MessageView => ({
  id: String(m._id),
  senderRole: m.senderRole,
  text: m.text,
  productRef: m.productRef,
  createdAt: m.createdAt,
});

/** List the conversations the user participates in, from their perspective. */
export const listConversations = async (userId: string): Promise<ConversationView[]> => {
  const convs = await Conversation.find({
    $or: [{ buyerId: userId }, { shopId: userId }],
  })
    .sort({ lastMessageAt: -1 })
    .lean();

  return convs.map((c) => {
    const perspective: SenderRole = c.buyerId === userId ? "buyer" : "shop";
    const isBuyer = perspective === "buyer";
    return {
      id: String(c._id),
      otherId: isBuyer ? c.shopId : c.buyerId,
      otherName: isBuyer ? c.shopName : c.buyerName,
      otherAvatar: isBuyer ? c.shopAvatar || "" : "",
      lastMessage: c.lastMessage,
      lastSenderRole: c.lastSenderRole,
      lastMessageAt: c.lastMessageAt,
      unread: isBuyer ? c.unreadBuyer : c.unreadShop,
      perspective,
    };
  });
};

export type SendInput = {
  userId: string;
  // reply path
  conversationId?: string;
  // buyer-initiated path
  shopId?: string;
  shopName?: string;
  shopAvatar?: string;
  buyerName?: string;
  text: string;
  productRef?: IProductRef;
};

export type SendResult =
  | { ok: true; conversationId: string; message: MessageView }
  | { ok: false; status: number; message: string };

export const sendMessage = async (input: SendInput): Promise<SendResult> => {
  const { userId, text } = input;
  if (!text || !text.trim()) {
    return { ok: false, status: 400, message: "text là bắt buộc" };
  }

  let convId: Types.ObjectId;
  let senderRole: SenderRole;

  if (input.conversationId) {
    if (!Types.ObjectId.isValid(input.conversationId)) {
      return { ok: false, status: 400, message: "conversationId không hợp lệ" };
    }
    const conv = await Conversation.findById(input.conversationId).lean();
    if (!conv) return { ok: false, status: 404, message: "Không tìm thấy hội thoại" };
    const side = sideOf(conv, userId);
    if (!side) return { ok: false, status: 403, message: "Không có quyền truy cập hội thoại" };
    convId = conv._id as Types.ObjectId;
    senderRole = side;
  } else {
    // Buyer initiating a conversation with a shop.
    if (!input.shopId) {
      return { ok: false, status: 400, message: "shopId là bắt buộc khi tạo hội thoại mới" };
    }
    if (input.shopId === userId) {
      return { ok: false, status: 400, message: "Không thể tự nhắn tin cho chính mình" };
    }
    const conv = await Conversation.findOneAndUpdate(
      { buyerId: userId, shopId: input.shopId },
      {
        $setOnInsert: {
          buyerId: userId,
          shopId: input.shopId,
          buyerName: input.buyerName || "Customer",
          shopName: input.shopName || "Shop",
          shopAvatar: input.shopAvatar || "",
        },
      },
      { upsert: true, new: true },
    ).lean();
    convId = conv!._id as Types.ObjectId;
    senderRole = "buyer";
  }

  const trimmed = text.trim();
  const message = await Message.create({
    conversationId: convId,
    senderRole,
    senderId: userId,
    text: trimmed,
    productRef: input.productRef,
  });

  const inc = senderRole === "buyer" ? { unreadShop: 1 } : { unreadBuyer: 1 };
  await Conversation.updateOne(
    { _id: convId },
    {
      $set: {
        lastMessage: trimmed.slice(0, PREVIEW_LEN),
        lastSenderRole: senderRole,
        lastMessageAt: new Date(),
      },
      $inc: inc,
    },
  );

  return { ok: true, conversationId: String(convId), message: toMessageView(message) };
};

export type ListMessagesResult =
  | { ok: true; messages: MessageView[] }
  | { ok: false; status: number; message: string };

export const listMessages = async (
  userId: string,
  conversationId: string,
  after?: string,
): Promise<ListMessagesResult> => {
  if (!Types.ObjectId.isValid(conversationId)) {
    return { ok: false, status: 400, message: "conversationId không hợp lệ" };
  }
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) return { ok: false, status: 404, message: "Không tìm thấy hội thoại" };
  if (!sideOf(conv, userId)) {
    return { ok: false, status: 403, message: "Không có quyền truy cập hội thoại" };
  }

  const query: Record<string, unknown> = { conversationId: conv._id };
  if (after && Types.ObjectId.isValid(after)) {
    query._id = { $gt: new Types.ObjectId(after) };
  }
  const docs = await Message.find(query).sort({ _id: 1 }).lean();
  return { ok: true, messages: docs.map(toMessageView) };
};

export type ReadResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/** Zero the caller's unread count on a conversation. */
export const markRead = async (userId: string, conversationId: string): Promise<ReadResult> => {
  if (!Types.ObjectId.isValid(conversationId)) {
    return { ok: false, status: 400, message: "conversationId không hợp lệ" };
  }
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) return { ok: false, status: 404, message: "Không tìm thấy hội thoại" };
  const side = sideOf(conv, userId);
  if (!side) return { ok: false, status: 403, message: "Không có quyền truy cập hội thoại" };

  const update = side === "buyer" ? { unreadBuyer: 0 } : { unreadShop: 0 };
  await Conversation.updateOne({ _id: conv._id }, { $set: update });
  return { ok: true };
};
