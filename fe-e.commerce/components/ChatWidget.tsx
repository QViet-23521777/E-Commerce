"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Search, ArrowLeft, LogIn } from "lucide-react";
import {
  type ChatConversation,
  type ChatMessage,
  type OpenChatTarget,
  isChatAvailable,
  currentUserId,
  currentDisplayName,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  subscribeOpenChat,
  chatInitials,
  chatTimeLabel,
} from "@/lib/chat";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const CONV_POLL_MS = 10000;
const MSG_POLL_MS = 4000;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OpenChatTarget | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const userIdRef = useRef<string | null>(currentUserId());

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const perspective = active?.perspective ?? "buyer";
  const headerName = active?.otherName ?? draft?.shopName ?? "Shop Chat";
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  // Reflect login state AND drop another account's data the instant the session
  // changes. Logout navigates client-side (no full reload), so without this the
  // widget would keep showing the previous user's threads. We watch the active
  // user id on an interval + on tab focus/storage events (covers same-tab logout
  // and cross-tab sign-in) and wipe local chat state whenever it changes.
  useEffect(() => {
    const sync = () => {
      const uid = currentUserId();
      setLoggedIn(uid !== null);
      if (uid !== userIdRef.current) {
        userIdRef.current = uid;
        setConversations([]);
        setMessages([]);
        setActiveId(null);
        setDraft(null);
      }
    };
    sync();
    const iv = setInterval(sync, 2000);
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!isChatAvailable()) return;
    try {
      const list = await listConversations();
      setConversations(list);
    } catch {
      /* keep last good state */
    }
  }, []);

  // Poll the conversation list while the widget is open.
  useEffect(() => {
    if (!open || !loggedIn) return;
    refreshConversations();
    const iv = setInterval(refreshConversations, CONV_POLL_MS);
    return () => clearInterval(iv);
  }, [open, loggedIn, refreshConversations]);

  const openConversation = useCallback(
    async (id: string) => {
      setDraft(null);
      setActiveId(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
      );
      try {
        const msgs = await getMessages(id);
        setMessages(msgs);
      } catch {
        setMessages([]);
      }
      markRead(id).catch(() => {});
    },
    [],
  );

  // Poll the open thread for new messages.
  useEffect(() => {
    if (!activeId || !open) return;
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
  }, [activeId, open, refreshConversations]);

  // Product page → open the widget to a specific shop (existing thread or draft).
  useEffect(() => {
    const unsub = subscribeOpenChat(async (target) => {
      setOpen(true);
      if (!isChatAvailable()) return;
      let list = conversations;
      try {
        list = await listConversations();
        setConversations(list);
      } catch {
        /* use current */
      }
      const existing = list.find(
        (c) => c.perspective === "buyer" && c.otherId === target.shopId,
      );
      if (existing) {
        openConversation(existing.id);
      } else {
        setActiveId(null);
        setMessages([]);
        setDraft(target);
      }
    });
    return unsub;
  }, [conversations, openConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, draft]);

  function backToList() {
    setActiveId(null);
    setDraft(null);
    setMessages([]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (draft) {
        const { conversationId } = await sendMessage({
          shopId: draft.shopId,
          shopName: draft.shopName,
          shopAvatar: draft.shopAvatar,
          buyerName: currentDisplayName(),
          text,
          productRef: draft.productRef,
        });
        setInput("");
        setDraft(null);
        await refreshConversations();
        await openConversation(conversationId);
      } else if (activeId) {
        const { message } = await sendMessage({ conversationId: activeId, text });
        setInput("");
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message],
        );
        refreshConversations();
      }
    } catch {
      /* leave the input intact so the user can retry */
    } finally {
      setSending(false);
    }
  }

  const filtered = conversations.filter((c) =>
    c.otherName.toLowerCase().includes(search.toLowerCase()),
  );
  const showThread = Boolean(active || draft);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, y: 20, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE } }}
            exit={{ opacity: 0, y: 16, scale: 0.93, transition: { duration: 0.2 } }}
            className="absolute bottom-16 right-0 w-[360px] bg-white border-2 border-deep-navy rounded-2xl overflow-hidden flex flex-col"
            style={{ height: "480px", boxShadow: "0 24px 48px rgba(0,26,65,0.18)" }}
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-deep-navy bg-deep-navy shrink-0">
              <div className="flex items-center gap-2.5">
                {showThread && (
                  <button
                    onClick={backToList}
                    className="text-primary-container/70 hover:text-primary-container transition-colors mr-0.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-7 h-7 bg-primary-container rounded-full flex items-center justify-center">
                  <MessageCircle className="w-3.5 h-3.5 text-deep-navy" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-primary-container uppercase tracking-widest leading-none">
                    {showThread ? headerName : "Shop Chat"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {!loggedIn ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container border-2 border-deep-navy flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-deep-navy" />
                </div>
                <p className="text-sm font-bold text-deep-navy">Sign in to message shops</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Log in to start a conversation with any shop and track your replies here.
                </p>
                <Link
                  href="/login"
                  className="mt-1 inline-flex items-center gap-1.5 h-9 px-4 bg-primary-container text-deep-navy text-xs font-bold uppercase tracking-wide rounded-lg active:scale-[0.97] transition-transform"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {!showThread ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } }}
                    exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    {/* Search */}
                    <div className="px-3 py-2.5 border-b border-outline-variant shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search shops…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full border border-outline-variant rounded-lg pl-7 pr-3 py-1.5 text-xs bg-transparent text-on-surface placeholder:text-on-surface-variant outline-none"
                        />
                      </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
                          <MessageCircle className="w-7 h-7 text-outline-variant" />
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            No conversations yet. Open a product and tap{" "}
                            <span className="font-bold text-deep-navy">Chat</span> to message a shop.
                          </p>
                        </div>
                      ) : (
                        filtered.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container transition-colors duration-150"
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-deep-navy flex items-center justify-center text-[10px] font-bold text-primary-container">
                                {chatInitials(conv.otherName)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-xs text-on-surface truncate capitalize">{conv.otherName}</p>
                                <span className="text-[10px] text-on-surface-variant shrink-0 ml-1">
                                  {chatTimeLabel(conv.lastMessageAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                                {conv.lastSenderRole === "buyer" ? "You: " : ""}
                                {conv.lastMessage || "Start the conversation…"}
                              </p>
                            </div>
                            {conv.unread > 0 && (
                              <div className="min-w-4 h-4 px-1 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                                {conv.unread}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } }}
                    exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/40">
                      {draft?.productRef && (
                        <div className="flex items-center gap-2.5 p-2 bg-surface-container border border-outline-variant rounded-xl">
                          {draft.productRef.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={draft.productRef.image}
                              alt={draft.productRef.name}
                              className="w-9 h-9 rounded-lg object-cover bg-white shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">Asking about</p>
                            <p className="text-xs font-semibold text-deep-navy truncate">{draft.productRef.name}</p>
                          </div>
                        </div>
                      )}
                      {messages.length === 0 && !draft && (
                        <p className="text-center text-[11px] text-on-surface-variant py-8">No messages yet.</p>
                      )}
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                          const mine = msg.senderRole === perspective;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
                              className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            >
                              {!mine && (
                                <div className="w-5 h-5 rounded-full bg-deep-navy flex items-center justify-center text-[8px] font-bold text-primary-container shrink-0 mr-1.5 mt-1">
                                  {chatInitials(active?.otherName ?? "")}
                                </div>
                              )}
                              <div className={`max-w-[75%] flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                                {msg.productRef && (
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-container border border-outline-variant rounded-lg max-w-full">
                                    {msg.productRef.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={msg.productRef.image} alt="" className="w-5 h-5 rounded object-cover bg-white shrink-0" />
                                    )}
                                    <span className="text-[10px] font-semibold text-deep-navy truncate">{msg.productRef.name}</span>
                                  </div>
                                )}
                                <div
                                  className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                    mine
                                      ? "bg-deep-navy text-primary-container rounded-br-sm"
                                      : "bg-surface-container border border-outline-variant text-on-surface rounded-bl-sm"
                                  }`}
                                >
                                  {msg.text}
                                </div>
                                <span className="text-[9px] text-on-surface-variant px-1">{chatTimeLabel(msg.createdAt)}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2.5 border-t-2 border-deep-navy bg-white flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message…"
                        className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-xs bg-transparent text-on-surface placeholder:text-on-surface-variant outline-none focus:border-deep-navy transition-colors"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="w-8 h-8 bg-deep-navy text-primary-container rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 active:scale-[0.93]"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="relative w-14 h-14 bg-deep-navy text-primary-container rounded-full flex items-center justify-center border-2 border-primary-container/20 transition-colors duration-150 hover:border-primary-container/50"
        style={{ boxShadow: "0 8px 24px rgba(0,26,65,0.3)" }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
              exit={{ opacity: 0, rotate: 45, scale: 0.7, transition: { duration: 0.15 } }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE } }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.15 } }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!open && totalUnread > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, transition: { type: "spring", duration: 0.4, bounce: 0.4 } }}
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
          >
            {totalUnread}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
