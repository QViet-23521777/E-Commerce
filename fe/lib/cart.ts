"use client";

import { useEffect, useState } from "react";

/**
 * Client-only shopping cart. The backend has no cart service (see
 * INTEGRATION_STATUS.md), so the cart lives in localStorage and is shared across
 * the product, cart and checkout pages. Prices are integer Vietnamese Dong.
 */
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number; // VND, integer
  qty: number;
  variant?: string;
  // Real inventory linkage — present when the item was added from a product
  // page whose shop lookup succeeded. Required for stock deduction + seller
  // attribution at checkout. Absent on legacy/demo items (amount-only fallback).
  inventoryId?: string;
  sellerId?: string;
}

const CART_KEY = "cart_v1";
const ORDER_PREFIX = "order_snapshot_";
const COUPON_KEY = "applied_coupon_v1";
const CART_EVENT = "cart:changed";

/** A snapshot of a completed order, stashed so the confirmation page can show
 *  line items (the payment record itself only stores an amount). */
export interface OrderSnapshot {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  method: "wallet" | "momo";
  createdAt: string;
}

// The cart starts empty. Fake demo items can't be stock-deducted or attributed
// to a seller, so the basket is only populated by real products added from the
// product page (which carry inventoryId + sellerId).
const DEMO_ITEMS: CartItem[] = [];

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (raw === null) {
    return [...DEMO_ITEMS];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(item: Omit<CartItem, "qty"> & { qty?: number }) {
  const items = read();
  const qty = Math.max(1, item.qty ?? 1);
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ ...item, qty });
  }
  write(items);
}

export function updateQty(productId: string, qty: number) {
  const items = read()
    .map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i));
  write(items);
}

export function removeFromCart(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearCart() {
  write([]);
}

export function cartCount(items?: CartItem[]): number {
  return (items ?? read()).reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(items?: CartItem[]): number {
  return (items ?? read()).reduce((s, i) => s + i.price * i.qty, 0);
}

// ── Order snapshots (for the confirmation page) ──────────────────────────────

export function saveOrderSnapshot(snapshot: OrderSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDER_PREFIX + snapshot.orderId, JSON.stringify(snapshot));
}

export function getOrderSnapshot(orderId: string): OrderSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ORDER_PREFIX + orderId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderSnapshot;
  } catch {
    return null;
  }
}

// ── Applied coupon (carried from cart → checkout) ────────────────────────────

export function getAppliedCoupon(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COUPON_KEY);
}

export function setAppliedCoupon(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) localStorage.setItem(COUPON_KEY, code);
  else localStorage.removeItem(COUPON_KEY);
}

// ── React hook ───────────────────────────────────────────────────────────────

/** Reactive cart hook — re-renders on any cart mutation (this tab or others). */
export function useCart(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return items;
}
