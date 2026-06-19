import { io, Socket } from "socket.io-client";
import { apiRequest } from "./api";
import { getUser, getAccessToken } from "./auth";

export type ChatPerspective = "buyer" | "shop";

export type ChatProductRef = {
  productId: string;
  name: string;
  image?: string;
  price?: number;
};

export type ChatConversation = {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatar: string;
  lastMessage: string;
  lastSenderRole: ChatPerspective;
  lastMessageAt: string;
  unread: number;
  perspective: ChatPerspective;
};

export type ChatMessage = {
  id: string;
  senderRole: ChatPerspective;
  text: string;
  productRef?: ChatProductRef;
  createdAt: string;
};

/** Chat needs a logged-in user (the gateway authenticates every chat route). */
export function isChatAvailable(): boolean {
  return getUser() !== null;
}

/** Display name the buyer presents to the shop (name → email local-part → "Customer"). */
export function currentDisplayName(): string {
  const u = getUser();
  if (!u) return "Customer";
  return u.name || u.email?.split("@")[0] || "Customer";
}

export async function listConversations(): Promise<ChatConversation[]> {
  const res = await apiRequest<{ success: boolean; data: ChatConversation[] }>(
    "/api/chat/conversations",
  );
  return res.data ?? [];
}

export async function getMessages(
  conversationId: string,
  after?: string,
): Promise<ChatMessage[]> {
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  const res = await apiRequest<{ success: boolean; data: ChatMessage[] }>(
    `/api/chat/conversations/${conversationId}/messages${qs}`,
  );
  return res.data ?? [];
}

export type SendMessagePayload = {
  conversationId?: string;
  shopId?: string;
  shopName?: string;
  shopAvatar?: string;
  buyerName?: string;
  text: string;
  productRef?: ChatProductRef;
};

export async function sendMessage(
  payload: SendMessagePayload,
): Promise<{ conversationId: string; message: ChatMessage }> {
  const res = await apiRequest<{
    success: boolean;
    data: { conversationId: string; message: ChatMessage };
  }>("/api/chat/messages", { method: "POST", body: payload });
  return res.data;
}

export async function markRead(conversationId: string): Promise<void> {
  await apiRequest(`/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
  });
}

// --- Socket.IO realtime ---

let socket: Socket | null = null;

export function connectChatSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  if (!token || socket?.connected) return socket;

  const url = process.env.NEXT_PUBLIC_CHAT_WS_URL || "http://localhost:3007";
  socket = io(url, {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket"],
    reconnectionAttempts: 5,
  });

  socket.on("connect_error", (err) => {
    console.error("[WS] connect error:", err.message);
  });

  return socket;
}

export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function joinConversation(conversationId: string) {
  socket?.emit("join_conversation", conversationId);
}

export function leaveConversation(conversationId: string) {
  socket?.emit("leave_conversation", conversationId);
}

export function onNewMessage(cb: (msg: ChatMessage) => void): () => void {
  socket?.on("new_message", cb);
  return () => { socket?.off("new_message", cb); };
}

export function onNewConversationMessage(
  cb: (payload: { conversationId: string; message: ChatMessage }) => void,
): () => void {
  socket?.on("new_conversation_message", cb);
  return () => { socket?.off("new_conversation_message", cb); };
}

// --- pub-sub: lets a product page pop the global ChatWidget open to a shop ---

export type OpenChatTarget = {
  shopId: string;
  shopName: string;
  shopAvatar?: string;
  productRef?: ChatProductRef;
};

type Listener = (t: OpenChatTarget) => void;
const listeners = new Set<Listener>();

export function openChatWith(target: OpenChatTarget) {
  listeners.forEach((l) => l(target));
}

export function subscribeOpenChat(cb: Listener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// --- small display helpers shared by the widget + shop inbox ---

export function chatInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function chatTimeLabel(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
