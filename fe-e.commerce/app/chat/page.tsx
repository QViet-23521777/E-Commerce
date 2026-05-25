"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Paperclip, Search, ArrowLeft, Smile, Package, MoreHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

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
      {
        id: 1,
        from: "buyer",
        text: "Hi, I wanted to check on the status of order #4918.",
        time: "10:20 AM",
      },
      {
        id: 2,
        from: "shop",
        text: "Hello Alex! Your V60 Ceramic Dripper has been dispatched and is on its way.",
        time: "10:28 AM",
      },
      {
        id: 3,
        from: "shop",
        text: "Your order has been shipped! Tracking number: NOR-4918-QW7XY via Bring Logistics.",
        time: "10:32 AM",
      },
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
      {
        id: 1,
        from: "buyer",
        text: "Do you offer custom engraving on the Bamboo Lamp?",
        time: "Yesterday",
      },
      {
        id: 2,
        from: "shop",
        text: "We can do a custom engraving for you! Just send us the text you'd like. It's $15 extra.",
        time: "Yesterday",
      },
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
      {
        id: 1,
        from: "buyer",
        text: "Can you notify me when the Frost Grey throw is back in stock?",
        time: "Mon",
      },
      {
        id: 2,
        from: "shop",
        text: "The Frost Grey is back in stock! Grab it before it sells out again.",
        time: "Mon",
      },
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
      {
        id: 1,
        from: "buyer",
        text: "Is the Leather Journal still available? Can you hold one for me?",
        time: "Sun",
      },
      {
        id: 2,
        from: "shop",
        text: "Sure, we can hold it for 48 hours.",
        time: "Sun",
      },
    ],
  },
];

export default function ChatPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<number | null>(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  function openConversation(id: number) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
    setActiveId(id);
    setMobileView("chat");
  }

  function sendMessage() {
    if (!input.trim() || !activeId) return;
    const msg: Message = {
      id: Date.now(),
      from: "buyer",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, msg],
              lastMessage: msg.text,
              time: msg.time,
            }
          : c
      )
    );
    setInput("");
  }

  const filtered = conversations.filter((c) =>
    c.shop.toLowerCase().includes(search.toLowerCase())
  );
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-10 py-8">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-label-caps text-primary mb-1">Messages</p>
            <h1 className="text-display-lg-mobile text-on-surface flex items-center gap-3">
              Shop Chat
              {totalUnread > 0 && (
                <span className="text-sm font-semibold bg-deep-navy text-primary-container px-2 py-0.5 rounded-full">
                  {totalUnread} new
                </span>
              )}
            </h1>
          </div>
          <Link
            href="/orders"
            className="text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors duration-150"
          >
            <Package className="w-4 h-4" />
            View Orders
          </Link>
        </div>

        {/* Chat Layout */}
        <div
          className="border-2 border-deep-navy rounded-2xl overflow-hidden flex bg-surface-container-lowest"
          style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}
        >
          {/* Conversation List */}
          <div
            className={`w-full sm:w-80 shrink-0 border-r-2 border-deep-navy flex flex-col ${
              mobileView === "chat" ? "hidden sm:flex" : "flex"
            }`}
          >
            {/* Search */}
            <div className="p-3 border-b border-outline-variant">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-xs bg-transparent text-on-surface placeholder:text-on-surface-variant"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/50 transition-colors duration-150 ${
                    activeId === conv.id
                      ? "bg-deep-navy"
                      : "hover:bg-surface-container"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                        activeId === conv.id
                          ? "bg-primary-container text-deep-navy"
                          : "bg-deep-navy text-primary-container"
                      }`}
                    >
                      {conv.avatar}
                    </div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-semibold text-sm truncate ${
                          activeId === conv.id
                            ? "text-primary-container"
                            : "text-on-surface"
                        }`}
                      >
                        {conv.shop}
                      </p>
                      <span
                        className={`text-xs shrink-0 ml-1 ${
                          activeId === conv.id
                            ? "text-primary-container/60"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {conv.time}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        activeId === conv.id
                          ? "text-primary-container/70"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unread > 0 && (
                    <div className="w-4 h-4 bg-primary-container text-deep-navy rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                      {conv.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col min-w-0 ${
              mobileView === "list" ? "hidden sm:flex" : "flex"
            }`}
          >
            {active ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b-2 border-deep-navy bg-surface-container-lowest shrink-0">
                  <button
                    onClick={() => setMobileView("list")}
                    className="sm:hidden mr-1 text-on-surface-variant hover:text-on-surface transition-colors duration-150"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-deep-navy flex items-center justify-center text-xs font-bold text-primary-container">
                      {active.avatar}
                    </div>
                    {active.online && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface text-sm">
                      {active.shop}
                    </p>
                    <p
                      className={`text-xs flex items-center gap-1 ${
                        active.online
                          ? "text-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {active.online ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block" />
                          Online
                        </>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                  <Link
                    href="/orders"
                    className="hidden sm:flex border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded-lg text-xs font-medium items-center gap-1.5 hover:border-deep-navy hover:text-on-surface transition-all duration-150"
                  >
                    <Package className="w-3 h-3" /> Orders
                  </Link>
                  <button className="text-on-surface-variant hover:text-on-surface transition-colors duration-150">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-background/40">
                  <AnimatePresence initial={false}>
                    {active.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: { duration: 0.25, ease: EASE },
                        }}
                        className={`flex ${
                          msg.from === "buyer" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.from === "shop" && (
                          <div className="w-6 h-6 rounded-full bg-deep-navy flex items-center justify-center text-[9px] font-bold text-primary-container shrink-0 mr-2 mt-1">
                            {active.avatar}
                          </div>
                        )}
                        <div
                          className={`max-w-[72%] flex flex-col gap-1 ${
                            msg.from === "buyer" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              msg.from === "buyer"
                                ? "bg-deep-navy text-primary-container rounded-br-sm"
                                : "bg-surface-container border border-outline-variant text-on-surface rounded-bl-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-on-surface-variant px-1">
                            {msg.time}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>

                {/* Input Bar */}
                <div className="px-4 py-3 border-t-2 border-deep-navy bg-surface-container-lowest flex items-center gap-2 shrink-0">
                  <button className="text-on-surface-variant hover:text-on-surface transition-colors duration-150">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="text-on-surface-variant hover:text-on-surface transition-colors duration-150">
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 border-2 border-deep-navy rounded-xl px-4 py-2.5 text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-9 h-9 bg-deep-navy text-primary-container rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity duration-150 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 bg-deep-navy rounded-full flex items-center justify-center">
                  <Send className="w-6 h-6 text-primary-container" />
                </div>
                <p className="font-semibold text-on-surface">
                  Select a conversation
                </p>
                <p className="text-sm text-on-surface-variant">
                  Choose a shop to start messaging.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
