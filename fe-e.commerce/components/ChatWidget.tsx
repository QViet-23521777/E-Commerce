"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  X,
  Send,
  Search,
  ArrowLeft,
  Paperclip,
  Smile,
} from "lucide-react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

type Sender = "buyer" | "shop";

type Message = {
  id: number;
  from: Sender;
  text: string;
  time: string;
};

type Conversation = {
  id: number;
  shop: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    shop: "Nordic Living Co.",
    avatar: "NL",
    lastMessage: "Your order has been shipped!",
    time: "10:32 AM",
    unread: 2,
    online: true,
    messages: [
      { id: 1, from: "buyer", text: "Hi, I wanted to check on the status of order #4918.", time: "10:20 AM" },
      { id: 2, from: "shop", text: "Hello Alex! Your V60 Ceramic Dripper has been dispatched.", time: "10:28 AM" },
      { id: 3, from: "shop", text: "Your order has been shipped! Tracking: NOR-4918-QW7XY via Bring Logistics.", time: "10:32 AM" },
    ],
  },
  {
    id: 2,
    shop: "Craft & Grain Studio",
    avatar: "CG",
    lastMessage: "We can do a custom engraving for you",
    time: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "buyer", text: "Do you offer custom engraving on the Bamboo Lamp?", time: "Yesterday" },
      { id: 2, from: "shop", text: "We can do a custom engraving for you! Just send us the text. It's $15 extra.", time: "Yesterday" },
    ],
  },
  {
    id: 3,
    shop: "Wool & Weave",
    avatar: "WW",
    lastMessage: "The Frost Grey is back in stock!",
    time: "Mon",
    unread: 1,
    online: true,
    messages: [
      { id: 1, from: "buyer", text: "Can you notify me when the Frost Grey throw is back in stock?", time: "Mon" },
      { id: 2, from: "shop", text: "The Frost Grey is back in stock! Grab it before it sells out again.", time: "Mon" },
    ],
  },
  {
    id: 4,
    shop: "Minimal Works",
    avatar: "MW",
    lastMessage: "Sure, we can hold it for 48 hours.",
    time: "Sun",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "buyer", text: "Is the Leather Journal still available? Can you hold one for me?", time: "Sun" },
      { id: 2, from: "shop", text: "Sure, we can hold it for 48 hours.", time: "Sun" },
    ],
  },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  function openConversation(id: number) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setActiveId(id);
  }

  function sendMessage() {
    if (!input.trim() || !activeId) return;
    const msg: Message = {
      id: Date.now(),
      from: "buyer",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, time: msg.time }
          : c
      )
    );
    setInput("");
  }

  const filtered = conversations.filter((c) =>
    c.shop.toLowerCase().includes(search.toLowerCase())
  );

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
                {active && (
                  <button
                    onClick={() => setActiveId(null)}
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
                    {active ? active.shop : "Shop Chat"}
                  </p>
                  {active && (
                    <p className={`text-[9px] mt-0.5 flex items-center gap-1 ${active.online ? "text-primary-container/70" : "text-white/40"}`}>
                      {active.online && <span className="w-1 h-1 rounded-full bg-primary inline-block" />}
                      {active.online ? "Online" : "Offline"}
                    </p>
                  )}
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
            <AnimatePresence mode="wait">
              {!active ? (
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
                    {filtered.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/50 hover:bg-surface-container transition-colors duration-150"
                      >
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-deep-navy flex items-center justify-center text-[10px] font-bold text-primary-container">
                            {conv.avatar}
                          </div>
                          {conv.online && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs text-on-surface truncate">{conv.shop}</p>
                            <span className="text-[10px] text-on-surface-variant shrink-0 ml-1">{conv.time}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                        {conv.unread > 0 && (
                          <div className="w-4 h-4 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">
                            {conv.unread}
                          </div>
                        )}
                      </button>
                    ))}
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
                    <AnimatePresence initial={false}>
                      {active.messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
                          className={`flex ${msg.from === "buyer" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.from === "shop" && (
                            <div className="w-5 h-5 rounded-full bg-deep-navy flex items-center justify-center text-[8px] font-bold text-primary-container shrink-0 mr-1.5 mt-1">
                              {active.avatar}
                            </div>
                          )}
                          <div className={`max-w-[75%] flex flex-col gap-1 ${msg.from === "buyer" ? "items-end" : "items-start"}`}>
                            <div
                              className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                msg.from === "buyer"
                                  ? "bg-deep-navy text-primary-container rounded-br-sm"
                                  : "bg-surface-container border border-outline-variant text-on-surface rounded-bl-sm"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-on-surface-variant px-1">{msg.time}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="px-3 py-2.5 border-t-2 border-deep-navy bg-white flex items-center gap-2 shrink-0">
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-xs bg-transparent text-on-surface placeholder:text-on-surface-variant outline-none focus:border-deep-navy transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className="w-8 h-8 bg-deep-navy text-primary-container rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 active:scale-[0.93]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => { setOpen((v) => !v); }}
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
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
          >
            {totalUnread}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
