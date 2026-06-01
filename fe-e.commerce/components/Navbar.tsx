"use client";

import { Search, User, ShoppingBag, Menu, X, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { label: "New Arrivals", href: "/search?category=new" },
  { label: "Collections", href: "/search" },
  { label: "Designers", href: "/search?filter=designers" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-deep-navy">
      <div className="max-w-[1280px] mx-auto px-10 h-20 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tighter text-deep-navy select-none"
          >
            ShopIn
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

          <Link
            href="/profile"
            className="p-2 rounded-full hover:bg-ice-blue transition-colors"
            title="Profile"
          >
            <User className="w-5 h-5 text-deep-navy" />
          </Link>
          <Link
            href="/orders"
            className="hidden sm:flex items-center gap-2 border-2 border-deep-navy px-4 py-2 rounded-xl text-label-caps text-deep-navy font-bold hover:bg-surface-container transition-colors duration-150 active:scale-[0.97]"
          >
            <Package className="w-4 h-4" />
            Orders
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 bg-primary-container px-5 py-2.5 rounded-xl border-2 border-transparent hover:border-deep-navy transition-colors text-label-caps text-deep-navy font-bold active:scale-[0.97]"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart
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
