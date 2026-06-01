"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Search, Send, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";
import {
  type ChatConversation,
  type ChatMessage,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  chatInitials,
  chatTimeLabel,
} from "@/lib/chat";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const CONV_POLL_MS = 10000;
const MSG_POLL_MS = 4000;

export default function ShopMessagesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?redirect=/shop/messages");
      return;
    }
    setReady(true);
  }, [router]);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      // The shop inbox only shows threads where this account is the shop.
      setConversations(list.filter((c) => c.perspective === "shop"));
    } catch {
      /* keep last good state */
    }
  }, []);

  // Poll conversation list.
  useEffect(() => {
    if (!ready) return;
    refreshConversations();
    const iv = setInterval(refreshConversations, CONV_POLL_MS);
    return () => clearInterval(iv);
  }, [ready, refreshConversations]);

  const openConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setLoadingThread(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
    try {
      const msgs = await getMessages(id);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
    markRead(id).catch(() => {});
  }, []);

  // Poll the open thread.
  useEffect(() => {
    if (!activeId) return;
    const tick = async () => {
      const last = messagesRef.current[messagesRef.current.length - 1]?.id;
      try {
        const newer = await getMessages(activeId, last);
        if (newer.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            return [...prev, ...newer.filter((m) => !seen.has(m.id))];
          });
          markRead(activeId).catch(() => {});
          refreshConversations();
        }
      } catch {
        /* ignore transient poll errors */
      }
    };
    const iv = setInterval(tick, MSG_POLL_MS);
    return () => clearInterval(iv);
  }, [activeId, refreshConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const { message } = await sendMessage({ conversationId: activeId, text });
      setInput("");
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
      refreshConversations();
    } catch {
      /* leave input for retry */
    } finally {
      setSending(false);
    }
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const filtered = conversations.filter((c) =>
    c.otherName.toLowerCase().includes(search.toLowerCase()),
  );

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full flex flex-col min-h-0 flex-1">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-primary-container" />
          <p className="text-label-caps text-primary">Inbox</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Messages</h1>
      </div>

      {/* Two-pane shell */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 bg-white border-2 border-deep-navy rounded-2xl overflow-hidden">
        {/* Left: conversation list */}
        <div
          className={`flex-col border-r-2 border-deep-navy min-h-0 ${
            activeId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-outline-variant shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="Search customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant outline-none focus:border-deep-navy transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2 py-16">
                <MessageCircle className="w-8 h-8 text-outline-variant" />
                <p className="text-sm text-on-surface-variant">No customer messages yet.</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const activeRow = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/50 transition-colors duration-150 ${
                      activeRow ? "bg-primary-container/15" : "hover:bg-surface-container"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-deep-navy flex items-center justify-center text-xs font-bold text-primary-container shrink-0">
                      {chatInitials(conv.otherName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-on-surface truncate">{conv.otherName}</p>
                        <span className="text-[10px] text-on-surface-variant shrink-0 ml-1">
                          {chatTimeLabel(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {conv.lastSenderRole === "shop" ? "You: " : ""}
                        {conv.lastMessage || "Start the conversation…"}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="min-w-5 h-5 px-1.5 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {conv.unread}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: thread */}
        <div className={`flex-col min-h-0 ${activeId ? "flex" : "hidden lg:flex"}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-container border-2 border-deep-navy flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-deep-navy" />
              </div>
              <p className="text-sm font-bold text-deep-navy">Select a conversation</p>
              <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                Pick a customer on the left to read and reply to their messages.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-deep-navy bg-deep-navy shrink-0">
                <button
                  onClick={() => setActiveId(null)}
                  className="lg:hidden text-primary-container/70 hover:text-primary-container transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-[11px] font-bold text-deep-navy shrink-0">
                  {chatInitials(active.otherName)}
                </div>
                <p className="text-sm font-bold text-white truncate">{active.otherName}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-background/40">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant py-10">No messages yet.</p>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const mine = msg.senderRole === "shop";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                            {msg.productRef && (
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-container border border-outline-variant rounded-lg max-w-full">
                                {msg.productRef.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={msg.productRef.image} alt="" className="w-6 h-6 rounded object-cover bg-white shrink-0" />
                                )}
                                <span className="text-[11px] font-semibold text-deep-navy truncate">{msg.productRef.name}</span>
                              </div>
                            )}
                            <div
                              className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed ${
                                mine
                                  ? "bg-deep-navy text-primary-container rounded-br-sm"
                                  : "bg-white border border-outline-variant text-on-surface rounded-bl-sm"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-on-surface-variant px-1">{chatTimeLabel(msg.createdAt)}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              <div className="px-4 py-3 border-t-2 border-deep-navy bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your reply…"
                  className="flex-1 border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant outline-none focus:border-deep-navy transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-10 px-4 bg-primary-container text-deep-navy rounded-lg flex items-center gap-1.5 text-sm font-bold disabled:opacity-40 transition-opacity shrink-0 active:scale-[0.97]"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
