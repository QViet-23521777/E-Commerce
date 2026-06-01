"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  MessageSquare,
  Package,
  ShieldCheck,
  LogOut,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, badge: 8 },
  { href: "/admin/products", label: "Product Moderation", icon: Package, badge: 12 },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tighter text-white">ShopIn</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 border border-red-400/40 bg-red-400/10 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <p className="text-[10px] text-white/40 mt-1.5 font-medium">Platform Administration</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? "bg-primary-container text-deep-navy font-bold"
                  : "text-white/65 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-deep-navy" : "text-white/40 group-hover:text-white/70"
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && !active && (
                <span className="w-4 h-4 bg-red-400 text-white rounded-full text-[9px] font-bold flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-deep-navy/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin identity + logout */}
      <div className="border-t border-white/10 px-4 py-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-400/20 border border-red-400/30 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate leading-tight">
              Platform Admin
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">admin@shopin.com</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/80 hover:bg-white/8 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] shrink-0 bg-deep-navy flex-col h-screen sticky top-0 overflow-hidden border-r-2 border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-deep-navy border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tighter text-white">ShopIn</span>
          <span className="text-[9px] font-bold text-red-400 border border-red-400/40 px-1.5 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="lg:hidden fixed top-0 left-0 z-50 w-[260px] h-full bg-deep-navy"
            >
              <SidebarContent onLinkClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
