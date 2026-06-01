"use client";

import { Search, User, ShoppingBag, Menu, X, Package, LogOut, Snowflake } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUser, clearTokens, type AuthUser } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { useCart, cartCount } from "@/lib/cart";

const NAV_LINKS: { label: string; href: string }[] = [];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const cartItems = useCart();
  const count = cartCount(cartItems);

  useEffect(() => {
    setUser(getUser());
  }, []);

  async function handleLogout() {
    try { await apiRequest("/api/users/logout", { method: "POST" }); } catch {}
    clearTokens();
    setUser(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-deep-navy">
      <div className="max-w-[1280px] mx-auto px-10 h-20 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-12">
          <Link
            href="/"
            aria-label="ShopIn — home"
            className="group flex items-center gap-2.5 select-none"
          >
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-deep-navy border-2 border-deep-navy transition-colors duration-150 group-hover:bg-primary-container">
              <Snowflake
                className="w-5 h-5 text-primary-container transition-colors duration-150 group-hover:text-deep-navy"
                strokeWidth={2.5}
              />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-deep-navy leading-none">
              ShopIn
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors duration-150 ${
                  pathname === item.href
                    ? "text-deep-navy font-bold border-b-2 border-primary-container pb-0.5"
                    : "text-on-surface-variant hover:text-deep-navy"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center h-10 px-4 border border-deep-navy rounded-xl bg-white gap-2">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none text-sm w-36 placeholder:text-outline"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.location.href = `/search?q=${(e.target as HTMLInputElement).value}`;
                }
              }}
            />
          </div>

          {user ? (
            <div className="relative group">
              <button
                className="p-2 rounded-full hover:bg-ice-blue transition-colors flex items-center gap-1.5"
                title={user.email}
              >
                <User className="w-5 h-5 text-deep-navy" />
                <span className="hidden md:block text-xs font-bold text-deep-navy max-w-[80px] truncate">
                  {user.name ?? user.email.split("@")[0]}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border-2 border-deep-navy rounded-xl shadow-sm py-1 w-44 hidden group-focus-within:block group-hover:block z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm font-medium text-deep-navy hover:bg-surface-container"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-surface-container flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 rounded-full hover:bg-ice-blue transition-colors"
              title="Sign In"
            >
              <User className="w-5 h-5 text-deep-navy" />
            </Link>
          )}

          <Link
            href="/orders"
            className="hidden sm:flex items-center gap-2 border-2 border-deep-navy px-4 py-2 rounded-xl text-label-caps text-deep-navy font-bold hover:bg-surface-container transition-colors duration-150 active:scale-[0.97]"
          >
            <Package className="w-4 h-4" />
            Orders
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-primary-container px-5 py-2.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors text-label-caps text-deep-navy font-bold active:scale-[0.97]"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center bg-deep-navy text-primary-container text-[10px] font-bold rounded-full">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t-2 border-deep-navy bg-white px-6 py-6 space-y-4">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block text-base font-medium text-deep-navy"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              className="block w-full text-left text-base font-medium text-red-600"
            >
              Sign Out
            </button>
          )}
          <div className="flex items-center h-10 px-4 border border-deep-navy rounded-xl bg-white gap-2 mt-4">
            <Search className="w-4 h-4 text-outline shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none text-sm w-full placeholder:text-outline"
            />
          </div>
        </div>
      )}
    </header>
  );
}
