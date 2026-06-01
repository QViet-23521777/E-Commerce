# Shop Ownership + Product Approval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate seller-created products behind admin approval (pending → public) and surface the owning shop (name, location, derived stat, stubbed chat button) on the product detail page.

**Architecture:** Additive changes only. A `status` field on `Product` (inventory service) drives public visibility + the seller/admin tabs; two new public read endpoints expose the owning shop. Microservice boundaries preserved (product/inventory data stays in inventory service; shop identity in user service; the gateway proxies). No new services.

**Tech Stack:** Hono + Mongoose (TypeScript) backend services behind a Hono gateway; Next.js App Router frontend (motion/react, lucide-react, Tailwind + Nordic Frost tokens).

**Verification note:** The inventory and user services have **no test runner** (only the gateway has `__tests__`). Per "minimize backend changes," this plan does not add a framework. The gating automated check is the TypeScript compiler (`npx tsc --noEmit`); behavioural checks are explicit manual API/UI steps (require the docker stack running — Mongo is on host port 27018, gateway on 3000).

---

## File structure

**Backend — inventory service** (`be-e.commerce/services/inventoryServices/src/`)
- `models/product.model.ts` — add `status` + `rejectionReason`.
- `services/product.services.ts` — approved-only filters; `listProductsByStatus`, `setProductStatus`.
- `services/inventory.services.ts` — `getShopByProductId`.
- `controllers/product.controller.ts` — `handleListModeration`, `handleSetProductStatus`.
- `controllers/inventory.controller.ts` — `handleGetShopByProductId`.
- `routes/product.route.ts`, `routes/inventory.route.ts` — new routes.
- `scripts/seedProducts.ts` — seed `status: approved`; `scripts/backfillProductStatus.ts` (new) — one-time backfill.

**Backend — user service** (`be-e.commerce/services/userServices/src/`)
- `services/seller.services.ts`, `controllers/seller.controller.ts`, `routes/seller.routes.ts` — public shop projection.

**Backend — gateway** (`be-e.commerce/gateway/src/routes/`)
- `inventory.route.ts` — public by-product proxy.
- `seller.route.ts` — public shop proxy.
- `admin.route.ts` — admin moderation + set-status proxy.

**Frontend** (`fe-e.commerce/`)
- `lib/products.ts`, `lib/seller.ts` — types + fetch helpers; `lib/moderation.ts` (new).
- `app/shop/(hub)/products/page.tsx` — approval tabs/badges.
- `app/admin/(hub)/products/page.tsx` — wire to real API.
- `app/products/[id]/page.tsx` — Sold-by card.

---

## Task 1: Product `status` field + seed/backfill

**Files:**
- Modify: `be-e.commerce/services/inventoryServices/src/models/product.model.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/scripts/seedProducts.ts`
- Create: `be-e.commerce/services/inventoryServices/src/scripts/backfillProductStatus.ts`

- [ ] **Step 1: Add fields to the interface and schema**

In `product.model.ts`, add to the `PProduct` interface (after `track?: number;`):

```ts
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
```

In `ProductSchema`, add after the `track: { type: Number }` field:

```ts
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String },
```

- [ ] **Step 2: Make the seed insert approved products**

In `seedProducts.ts`, inside the `.map((p: any) => ({ ... }))`, add `status`:

```ts
    .map((p: any) => ({
      ...p,
      status: p.status ?? "approved",
      createdAt: toDate(p.createdAt) ?? new Date(),
      updatedAt: toDate(p.updatedAt) ?? new Date(),
    }));
```

- [ ] **Step 3: Create the one-time backfill script**

Create `scripts/backfillProductStatus.ts`:

```ts
import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { config } from "../config";

const main = async () => {
  await mongoose.connect(config.mongoUri);
  const res = await Product.updateMany(
    { status: { $exists: false } },
    { $set: { status: "approved" } },
  );
  console.log("[backfill] matched:", res.matchedCount, "modified:", res.modifiedCount);
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error("[backfill] error:", err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
```

- [ ] **Step 4: Type-check**

Run: `cd be-e.commerce/services/inventoryServices && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the backfill against the running DB (manual)**

Requires the stack up. Run from the service dir with the dockerized Mongo URI (host port 27018):
`npx ts-node src/scripts/backfillProductStatus.ts`
Expected: logs `matched`/`modified` counts; existing products now have `status: "approved"`.

- [ ] **Step 6: Commit**

```bash
git add be-e.commerce/services/inventoryServices/src/models/product.model.ts be-e.commerce/services/inventoryServices/src/scripts/seedProducts.ts be-e.commerce/services/inventoryServices/src/scripts/backfillProductStatus.ts
git commit -m "feat(inventory): add product approval status + backfill"
```

---

## Task 2: Approved-only public visibility

**Files:**
- Modify: `be-e.commerce/services/inventoryServices/src/services/product.services.ts`

- [ ] **Step 1: Filter the single-product read**

`getProductById`: change the lookup to require approved:

```ts
export const getProductById = async (productId: string) => {
  const product = await Product.findOne({ _id: productId, status: "approved" });
  if (!product) throw new Error("Product does not exists");
  return product;
};
```

- [ ] **Step 2: Filter the cursor list queries**

In `getTopProductPurchases`, `getTopSale`, `getTopPoint`: each builds a local `const query: any = {}`. Immediately after that line add:

```ts
  query.status = "approved";
```

In `getTopByType`: change the initializer to include status:

```ts
  const query: Record<string, unknown> = { type, status: "approved" };
```

- [ ] **Step 3: Filter the multi-type query**

In `getTopByListType`, every `Product.find()` call (there are four, one per `ord` branch) takes no filter today. Add the filter argument to each:

```ts
Product.find({ status: "approved" })
```

(Replace each `Product.find()` with `Product.find({ status: "approved" })` inside the `price`/`sale`/`numPurchases`/`point` branches.)

- [ ] **Step 4: Filter the search aggregation**

In `findProduct`, the first pipeline stage is `$match: { normalize: { $regex: ... } }`. Add status to that match object:

```ts
    {
      $match: {
        normalize: { $regex: normalizedFind, $options: "i" },
        status: "approved",
      },
    },
```

- [ ] **Step 5: Type-check**

Run: `cd be-e.commerce/services/inventoryServices && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check (requires stack)**

Create a product via the seller flow (stays pending) and confirm it is absent from `GET http://localhost:3000/api/products/search?q=<name>` and storefront, while an approved/seeded product still appears.

- [ ] **Step 7: Commit**

```bash
git add be-e.commerce/services/inventoryServices/src/services/product.services.ts
git commit -m "feat(inventory): hide non-approved products from public reads"
```

---

## Task 3: Moderation + set-status + shop-by-product (service + controllers + routes)

**Files:**
- Modify: `be-e.commerce/services/inventoryServices/src/services/product.services.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/services/inventory.services.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/controllers/product.controller.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/controllers/inventory.controller.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/routes/product.route.ts`
- Modify: `be-e.commerce/services/inventoryServices/src/routes/inventory.route.ts`

- [ ] **Step 1: Add product moderation service fns**

At the top of `product.services.ts` add an import for the Inventory model (used for the seller join):

```ts
import Inventory from "../models/inventory.model";
```

Append to `product.services.ts`:

```ts
export const listProductsByStatus = async (
  status: string = "pending",
  limit: number = 50,
) => {
  const products = await Product.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const ids = products.map((p) => p._id);
  const invs = await Inventory.find({ productId: { $in: ids } })
    .select("productId sellerId")
    .lean();
  const sellerByProduct = new Map(
    invs.map((i) => [String(i.productId), String(i.sellerId)]),
  );
  return products.map((p) => ({
    ...p,
    sellerId: sellerByProduct.get(String(p._id)) ?? null,
  }));
};

export const setProductStatus = async (
  productId: string,
  status: string,
  reason?: string,
) => {
  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  const update: Record<string, unknown> = { status };
  update.rejectionReason = status === "rejected" ? (reason ?? "") : undefined;
  const product = await Product.findByIdAndUpdate(productId, update, {
    new: true,
  });
  if (!product) throw new Error("Product does not exists");
  return product;
};
```

- [ ] **Step 2: Add the shop-by-product service fn**

Append to `inventory.services.ts`:

```ts
export const getShopByProductId = async (productId: string) => {
  const inv = await Inventory.findOne({ productId });
  if (!inv) throw new Error("SHOP_NOT_FOUND");
  const sellerId = String(inv.sellerId);
  const sellerInventories = await Inventory.find({ sellerId }).populate(
    "productId",
  );
  const productCount = sellerInventories.length;
  const unitsSold = sellerInventories.reduce((sum, it) => {
    const p = it.productId as unknown as { numPurchases?: number } | null;
    return sum + (p?.numPurchases ?? 0);
  }, 0);
  return { sellerId, productCount, unitsSold };
};
```

- [ ] **Step 3: Add product controller handlers**

In `product.controller.ts`, add `listProductsByStatus, setProductStatus` to the import from `../services/product.services`, then append:

```ts
export const handleListModeration = async (c: Context) => {
  try {
    const status = c.req.query("status") || "pending";
    const limit = Number(c.req.query("limit")) || 50;
    const products = await listProductsByStatus(status, limit);
    return c.json({ success: true, data: products });
  } catch (error) {
    console.error("[handleListModeration]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleSetProductStatus = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const { status, reason } = await c.req.json();
    const product = await setProductStatus(productId, status, reason);
    return c.json({ success: true, data: product });
  } catch (error: any) {
    if (error.message === "Product does not exists") {
      return c.json({ success: false, message: error.message }, 404);
    }
    if (error.message === "INVALID_STATUS") {
      return c.json({ success: false, message: error.message }, 400);
    }
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
```

- [ ] **Step 4: Add inventory controller handler**

In `inventory.controller.ts`, add `getShopByProductId` to the import from `../services/inventory.services`, then append:

```ts
export const handleGetShopByProductId = async (c: Context) => {
  try {
    const productId = c.req.param("productId")?.toString() || "";
    const shop = await getShopByProductId(productId);
    return c.json({ success: true, data: shop });
  } catch (error: any) {
    if (error.message === "SHOP_NOT_FOUND") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
```

- [ ] **Step 5: Wire product routes (order matters)**

In `product.route.ts`, import the two handlers, then register them **before** the `GET /:productId` catch-all:

```ts
router.get("/moderation", handleListModeration);
router.patch("/:productId/status", handleSetProductStatus);

router.get("/:productId", ProductById);
```

- [ ] **Step 6: Wire inventory route**

In `inventory.route.ts`, import `handleGetShopByProductId` and register it before `GET /:inventoryId`:

```ts
router.get("/product/:productId", handleGetShopByProductId);
```

- [ ] **Step 7: Type-check**

Run: `cd be-e.commerce/services/inventoryServices && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Manual check (requires stack)**

- `GET http://<inventory>/api/products/moderation?status=pending` → returns the pending array with `sellerId` attached.
- `PATCH http://<inventory>/api/products/<id>/status` body `{"status":"approved"}` → product flips and becomes publicly visible.
- `GET http://<inventory>/api/inventory/product/<productId>` → `{ sellerId, productCount, unitsSold }`.

- [ ] **Step 9: Commit**

```bash
git add be-e.commerce/services/inventoryServices/src
git commit -m "feat(inventory): moderation list, set-status, and shop-by-product endpoints"
```

---

## Task 4: User-service public shop projection

**Files:**
- Modify: `be-e.commerce/services/userServices/src/services/seller.services.ts`
- Modify: `be-e.commerce/services/userServices/src/controllers/seller.controller.ts`
- Modify: `be-e.commerce/services/userServices/src/routes/seller.routes.ts`

- [ ] **Step 1: Add the service fn**

Append to `seller.services.ts` (it already imports `User` and `UserProfile`):

```ts
export const getSellerPublicProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  const profile: any = await UserProfile.findOne({ userId });
  return {
    id: user._id,
    name: user.name,
    address: profile?.address ?? "",
    avatar: profile?.avatar ?? "",
  };
};
```

- [ ] **Step 2: Add the controller**

In `seller.controller.ts`, add `getSellerPublicProfile` to the import from `../services/seller.services`, then append:

```ts
export const getSellerPublic = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const data = await getSellerPublicProfile(userId);
    return c.json({ success: true, data }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};
```

(`handleError` already maps `USER_NOT_FOUND` → 404.)

- [ ] **Step 3: Add the route (before `/:userId`)**

In `seller.routes.ts`, import `getSellerPublic` and register it ahead of the `/:userId` GET:

```ts
sellerRoutes.get("/:userId/public", getSellerPublic);
sellerRoutes.get("/:userId", getSeller);
```

- [ ] **Step 4: Type-check**

Run: `cd be-e.commerce/services/userServices && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add be-e.commerce/services/userServices/src
git commit -m "feat(user): public seller/shop profile projection"
```

---

## Task 5: Gateway proxies

**Files:**
- Modify: `be-e.commerce/gateway/src/routes/inventory.route.ts`
- Modify: `be-e.commerce/gateway/src/routes/seller.route.ts`
- Modify: `be-e.commerce/gateway/src/routes/admin.route.ts`

- [ ] **Step 1: Public by-product proxy**

In gateway `inventory.route.ts`, add **before** the `GET /:inventoryId` route:

```ts
router.get("/product/:productId", injectInternalSecret, (c) => {
  const productId = c.req.param("productId");
  return Request(c, `${BASE}/api/inventory/product/${productId}`, "GET");
});
```

- [ ] **Step 2: Public shop proxy**

In gateway `seller.route.ts`, add **before** the `GET /:userId` route:

```ts
router.get("/:userId/public", injectInternalSecret, (c) => {
  const userId = c.req.param("userId");
  return Request(c, `${BASE}/api/sellers/${userId}/public`, "GET");
});
```

- [ ] **Step 3: Admin moderation proxies**

In gateway `admin.route.ts`, add an inventory base constant after the existing imports/router creation:

```ts
const INVENTORY_BASE =
  process.env.INVENTORY_SERVICE_URL || process.env.PRODUCT_SERVICE_URL;
```

Then add two routes (mirror the `ban-user` admin guard):

```ts
router.get(
  "/products/moderation",
  authenticate,
  injectInternalSecret,
  ipWhitelist,
  checkAdminAuthorization,
  (c) => {
    const status = c.req.query("status") || "pending";
    const limit = c.req.query("limit") || "50";
    return Request(
      c,
      `${INVENTORY_BASE}/api/products/moderation?status=${status}&limit=${limit}`,
      "GET",
    );
  },
);

router.patch(
  "/products/:productId/status",
  authenticate,
  injectInternalSecret,
  ipWhitelist,
  checkAdminAuthorization,
  (c) => {
    const productId = c.req.param("productId");
    return Request(
      c,
      `${INVENTORY_BASE}/api/products/${productId}/status`,
      "PATCH",
    );
  },
);
```

- [ ] **Step 4: Type-check the gateway**

Run: `cd be-e.commerce/gateway && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual check (requires stack)**

- `GET http://localhost:3000/api/inventory/product/<productId>` → shop stats (no auth needed).
- `GET http://localhost:3000/api/sellers/<sellerId>/public` → `{ name, address, avatar }` (no auth).
- `GET http://localhost:3000/api/admin/products/moderation?status=pending` with an admin Bearer token → pending list.

- [ ] **Step 6: Commit**

```bash
git add be-e.commerce/gateway/src/routes
git commit -m "feat(gateway): proxy public shop reads + admin moderation routes"
```

---

## Task 6: Frontend data layer (types + helpers)

**Files:**
- Modify: `fe-e.commerce/lib/products.ts`
- Modify: `fe-e.commerce/lib/seller.ts`
- Create: `fe-e.commerce/lib/moderation.ts`

- [ ] **Step 1: Extend `BackendProduct` + add shop helper**

In `lib/products.ts`, add to the `BackendProduct` interface:

```ts
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
```

Append to `lib/products.ts`:

```ts
export interface ShopOfProduct {
  sellerId: string;
  productCount: number;
  unitsSold: number;
}

export async function fetchShopByProduct(
  productId: string,
): Promise<ShopOfProduct | null> {
  try {
    const res = await apiRequest<{ success: boolean; data: ShopOfProduct }>(
      `/api/inventory/product/${encodeURIComponent(productId)}`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Add public-shop fetch to `lib/seller.ts`**

Append to `lib/seller.ts`:

```ts
export interface PublicShop {
  id: string;
  name: string;
  address: string;
  avatar: string;
}

export async function fetchSellerPublicProfile(
  sellerId: string,
): Promise<PublicShop | null> {
  try {
    const res = await apiRequest<{ success: boolean; data: PublicShop }>(
      `/api/sellers/${encodeURIComponent(sellerId)}/public`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Create `lib/moderation.ts`**

```ts
import { apiRequest } from "./api";
import type { BackendProduct } from "./products";

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface ModerationProduct extends BackendProduct {
  sellerId?: string | null;
}

export async function fetchModerationProducts(
  status: ModerationStatus = "pending",
  limit = 50,
): Promise<ModerationProduct[]> {
  const res = await apiRequest<{ success: boolean; data: ModerationProduct[] }>(
    `/api/admin/products/moderation?status=${status}&limit=${limit}`,
  );
  return res.data ?? [];
}

export async function setProductModeration(
  productId: string,
  status: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  await apiRequest(
    `/api/admin/products/${encodeURIComponent(productId)}/status`,
    { method: "PATCH", body: { status, reason } },
  );
}
```

- [ ] **Step 4: Type-check the frontend**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add fe-e.commerce/lib/products.ts fe-e.commerce/lib/seller.ts fe-e.commerce/lib/moderation.ts
git commit -m "feat(web): data helpers for shop-by-product, public shop, moderation"
```

---

## Task 7: Seller portal — approval tabs

**Files:**
- Modify: `fe-e.commerce/app/shop/(hub)/products/page.tsx`

- [ ] **Step 1: Add approval to the Row model and `toRow`**

Add `approval` + `rejectionReason` to the `Row` interface:

```ts
  approval: "pending" | "approved" | "rejected";
  rejectionReason?: string;
```

In `toRow`, add before the `return`:

```ts
  const approval = (p?.status as Row["approval"]) ?? "approved";
```

and include in the returned object:

```ts
    approval,
    rejectionReason: p?.rejectionReason,
```

- [ ] **Step 2: Replace the tab definitions**

Replace the `TabId` type and `TABS` array:

```ts
type TabId = "all" | "active" | "pending" | "rejected";
const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending Approval" },
  { id: "rejected", label: "Rejected" },
];
```

- [ ] **Step 3: Filter by approval and recount**

In the `filtered` memo, replace the first `.filter(...)` (the `activeTab` one) with:

```ts
      .filter((r) =>
        activeTab === "all" ? true : r.approval === activeTab,
      )
```

Replace `tabCounts` with:

```ts
  const tabCounts: Record<TabId, number> = {
    all: rows.length,
    active: rows.filter((r) => r.approval === "approved").length,
    pending: rows.filter((r) => r.approval === "pending").length,
    rejected: rows.filter((r) => r.approval === "rejected").length,
  };
```

- [ ] **Step 4: Show an approval badge column**

In the table header array, replace `"Status"` with `"Approval"` (keep the rest). Replace the existing Status `<td>` (the one rendering `STATUS_BADGE`/`STATUS_LABEL`) with an approval badge that also shows the reject reason as a tooltip:

```tsx
                        <td className="px-4 py-3.5">
                          {r.approval === "approved" ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
                              {r.status === "out_of_stock" ? "Out of Stock" : "Active"}
                            </span>
                          ) : r.approval === "pending" ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              Waiting Approval
                            </span>
                          ) : (
                            <span
                              title={r.rejectionReason || "Rejected"}
                              className="text-[10px] font-bold px-2 py-1 rounded-full border bg-red-50 text-red-700 border-red-200"
                            >
                              Rejected
                            </span>
                          )}
                        </td>
```

- [ ] **Step 5: Type-check + lint**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors. (If `STATUS_BADGE`/`STATUS_LABEL`/`ProductStatus` become unused, remove them to satisfy lint.)

- [ ] **Step 6: Manual check (requires stack)**

Log in as a seller, create a product → it shows under **Pending Approval**; after admin approval it moves to **Active**.

- [ ] **Step 7: Commit**

```bash
git add "fe-e.commerce/app/shop/(hub)/products/page.tsx"
git commit -m "feat(web/shop): approval-status tabs and badges"
```

---

## Task 8: Admin moderation — wire to the API

**Files:**
- Modify: `fe-e.commerce/app/admin/(hub)/products/page.tsx`

- [ ] **Step 1: Replace the page with the API-backed version**

Replace the entire file contents of `app/admin/(hub)/products/page.tsx` with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, XCircle, Eye, Clock, Ban, Loader2 } from "lucide-react";
import {
  fetchModerationProducts,
  setProductModeration,
  type ModerationProduct,
  type ModerationStatus,
} from "@/lib/moderation";
import { formatVND } from "@/lib/products";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FALLBACK_IMG = "https://placehold.co/400x400/e2e2e2/6a7a7b?text=IMG";

const STATUS_META: Record<ModerationStatus, { color: string; Icon: React.ElementType }> = {
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  approved: { color: "bg-primary/10 text-primary border-primary/20", Icon: CheckCircle2 },
  rejected: { color: "bg-red-50 text-red-500 border-red-200", Icon: Ban },
};

const TABS: ModerationStatus[] = ["pending", "approved", "rejected"];
const TAB_LABEL: Record<ModerationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ProductModerationPage() {
  const [activeTab, setActiveTab] = useState<ModerationStatus>("pending");
  const [items, setItems] = useState<ModerationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<ModerationProduct | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async (status: ModerationStatus) => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await fetchModerationProducts(status));
    } catch (err: unknown) {
      setLoadError((err as { message?: string })?.message ?? "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  async function act(id: string, status: "approved" | "rejected", reason?: string) {
    setActing(true);
    try {
      await setProductModeration(id, status, reason);
      setItems((prev) => prev.filter((p) => p._id !== id));
      setSelected(null);
      setRejecting(false);
      setRejectReason("");
    } catch {
      // keep panel open on failure
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px w-5 bg-red-400" />
          <p className="text-label-caps text-red-500">Moderation</p>
        </div>
        <h1 className="text-2xl font-bold text-deep-navy tracking-tight">Product Moderation</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Review and approve or reject product submissions.</p>
      </div>

      <div className="flex items-center gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
              activeTab === tab
                ? "bg-deep-navy text-white border-deep-navy"
                : "bg-white text-on-surface-variant border-outline-variant hover:border-deep-navy"
            }`}
          >
            {TAB_LABEL[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white border-2 border-deep-navy rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-on-surface-variant">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : loadError ? (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="font-semibold text-on-surface">{loadError}</p>
            <button onClick={() => load(activeTab)} className="mt-3 text-sm font-bold text-primary hover:underline">Try again</button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">No {TAB_LABEL[activeTab].toLowerCase()} products.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b-2 border-deep-navy">
                  {["Product", "Category", "Price", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-5 py-3 first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((product) => {
                  const status = (product.status ?? "pending") as ModerationStatus;
                  const meta = STATUS_META[status];
                  const StatusIcon = meta.Icon;
                  return (
                    <tr key={product._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl?.trim() ? product.imageUrl : FALLBACK_IMG}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-outline-variant shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-deep-navy max-w-[200px] truncate capitalize">{product.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">{product._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-on-surface-variant capitalize">{product.type ?? "—"}</td>
                      <td className="px-5 py-3 text-sm font-bold text-deep-navy">{formatVND(Number(product.price ?? 0))}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {TAB_LABEL[status]}
                        </span>
                      </td>
                      <td className="pr-5 py-3">
                        <button
                          onClick={() => { setSelected(product); setRejecting(false); setRejectReason(""); }}
                          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-deep-navy transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => !acting && setSelected(null)}
            />
            <motion.div
              initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="fixed right-0 top-0 h-full w-[440px] bg-white border-l-2 border-deep-navy z-50 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-deep-navy shrink-0">
                <h2 className="font-bold text-deep-navy">Product Review</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-deep-navy transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageUrl?.trim() ? selected.imageUrl : FALLBACK_IMG}
                  alt={selected.name}
                  className="w-full h-48 object-cover border-b-2 border-deep-navy"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-deep-navy capitalize">{selected.name}</h3>
                      <span className="text-xl font-bold text-deep-navy shrink-0">{formatVND(Number(selected.price ?? 0))}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full capitalize">{selected.type ?? "—"}</span>
                      {selected.sellerId && <span className="text-[10px] text-on-surface-variant">seller {selected.sellerId.slice(-8)}</span>}
                      <span className="text-[10px] text-outline font-mono">{selected._id.slice(-8)}</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-label-caps text-on-surface-variant mb-2">Product Description</p>
                    <p className="text-sm text-on-surface leading-relaxed">{selected.description}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-label-caps text-on-surface-variant">Moderation Actions</p>
                    <AnimatePresence mode="wait">
                      {rejecting ? (
                        <motion.div key="reject-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-deep-navy mb-1.5">Rejection Reason</label>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Explain why this product is being rejected…"
                              rows={3}
                              className="block w-full px-4 py-3 border-2 border-red-200 rounded-xl bg-white text-sm focus:border-red-400 outline-none transition-colors resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => act(selected._id, "rejected", rejectReason)}
                              disabled={!rejectReason.trim() || acting}
                              className="flex-1 flex items-center justify-center gap-2 h-10 bg-red-500 text-white text-sm font-bold rounded-xl border-2 border-transparent hover:border-red-700 disabled:opacity-40 transition-all"
                            >
                              <XCircle className="w-4 h-4" /> Confirm Rejection
                            </button>
                            <button onClick={() => setRejecting(false)} disabled={acting} className="px-4 h-10 bg-white text-on-surface-variant text-sm font-bold rounded-xl border-2 border-outline-variant hover:border-deep-navy transition-all">Cancel</button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="action-buttons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex gap-2">
                          <button
                            onClick={() => act(selected._id, "approved")}
                            disabled={selected.status === "approved" || acting}
                            className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary-container text-deep-navy text-sm font-bold rounded-xl border-2 border-transparent hover:border-deep-navy disabled:opacity-40 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => setRejecting(true)}
                            disabled={selected.status === "rejected" || acting}
                            className="flex-1 flex items-center justify-center gap-2 h-10 bg-white text-red-500 text-sm font-bold rounded-xl border-2 border-red-200 hover:bg-red-50 hover:border-red-400 disabled:opacity-40 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check (requires stack)**

As an admin, open Product Moderation → the **Pending** tab lists real submissions; Approve makes the product public; Reject with a reason removes it from pending and the seller sees the reason.

- [ ] **Step 4: Commit**

```bash
git add "fe-e.commerce/app/admin/(hub)/products/page.tsx"
git commit -m "feat(web/admin): wire product moderation to the real API"
```

---

## Task 9: Product detail — "Sold by" card

**Files:**
- Modify: `fe-e.commerce/app/products/[id]/page.tsx`

- [ ] **Step 1: Imports + state**

Add to the lucide import line: `Store, MapPin, MessageCircle, Package`. Add to the products import: `fetchShopByProduct, type ShopOfProduct`. Add a seller import:

```ts
import { fetchSellerPublicProfile, type PublicShop } from "@/lib/seller";
```

Add state near the other `useState` calls:

```ts
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [shopStats, setShopStats] = useState<ShopOfProduct | null>(null);
```

- [ ] **Step 2: Load the shop in the existing effect**

Inside the `useEffect`, after `setProduct(p); setLoading(false);`, add a non-blocking shop load:

```ts
      fetchShopByProduct(p.id).then(async (stats) => {
        if (cancelled || !stats) return;
        setShopStats(stats);
        const sp = await fetchSellerPublicProfile(stats.sellerId);
        if (!cancelled) setShop(sp);
      });
```

- [ ] **Step 3: Render the Sold-by card**

Immediately after the stock card (the `<div className="flex items-center gap-3 p-4 bg-surface-container-low ...">` block that ends the right-column `motion.div` content), insert:

```tsx
              {(shop || shopStats) && (
                <div className="p-5 bg-white border-2 border-deep-navy rounded-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-deep-navy flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-primary-container" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Sold by</p>
                        <p className="text-sm font-bold text-deep-navy truncate capitalize">
                          {shop?.name || "Shop"}
                        </p>
                        {shop?.address && (
                          <p className="flex items-center gap-1 text-xs text-on-surface-variant truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {shop.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      title="Chat is coming soon"
                      className="flex items-center gap-1.5 h-9 px-3 shrink-0 border-2 border-deep-navy/20 text-deep-navy text-xs font-bold rounded-xl opacity-60 cursor-not-allowed"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  </div>
                  {shopStats && (
                    <div className="flex items-center gap-5 pt-3 border-t border-outline-variant">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-deep-navy">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        {shopStats.productCount} products
                      </span>
                      <span className="text-xs font-semibold text-deep-navy">
                        {shopStats.unitsSold.toLocaleString()} sold
                      </span>
                    </div>
                  )}
                </div>
              )}
```

- [ ] **Step 4: Type-check + lint**

Run: `cd fe-e.commerce && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual check (requires stack)**

Open an approved product's page → the "Sold by" card shows the shop name, location, `N products · M sold`, and a disabled "Chat" button.

- [ ] **Step 6: Commit**

```bash
git add "fe-e.commerce/app/products/[id]/page.tsx"
git commit -m "feat(web): show owning shop + stubbed chat on product detail"
```

---

## Self-review notes

- **Spec coverage:** model+backfill (T1), public hiding (T2), moderation/set-status/by-product (T3), public shop (T4), gateway (T5), data layer (T6), seller tabs (T7), admin wiring (T8), Sold-by card + chat stub + derived stat (T9). All spec sections mapped.
- **Type consistency:** `setProductStatus`/`setProductModeration`, `fetchShopByProduct`/`ShopOfProduct`, `fetchSellerPublicProfile`/`PublicShop`, `fetchModerationProducts`/`ModerationProduct` names are used consistently across backend and frontend tasks.
- **Route ordering:** `/moderation` and `/product/:productId` and `/:userId/public` are all registered before their respective single-segment catch-alls.
- **No fake data:** rating is the derived `productCount`/`unitsSold` stat; chat is a disabled stub.
