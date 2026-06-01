# Design: Shop ownership on products + admin approval workflow

**Date:** 2026-05-30
**Status:** Approved (design); pending spec review

## Summary

Two related capabilities for the MiniSupermarket storefront:

1. **Shop ownership display** — the product detail page shows which shop owns the
   product (name, location, a derived trust stat) plus a stubbed "Chat with shop"
   button.
2. **Product approval workflow** — a product created by a seller is not public
   until an admin approves it. New products land in a "Waiting for approval" tab
   in the shop portal; once approved they become public and move to the "Active"
   tab.

The approval half requires a small, unavoidable backend slice (a status field
cannot be enforced client-side). The shop-display half is almost entirely
frontend plus two tiny public read endpoints. Every backend change is additive
and in-place. Microservice boundaries are respected (no new services).

## Current state (as built)

- **`Product`** (inventory service, `product` collection) has **no owner field and
  no status**. All public list/search queries return every product, so new
  products go live instantly.
- **`Inventory`** (inventory service) is the shop→product link:
  `sellerId → productId → quantity`. `getInventoryBySellerId` already
  `.populate("productId")`.
- A **shop** = a `seller` user + their `UserProfile` (`phone`, `address`,
  `avatar`; **no name, no rating**). The seller's display name lives on `User.name`.
  An unused `UserShop` model exists and is left untouched.
- `GET /api/sellers/:userId` returns `UserProfile` and is **auth-gated** at the
  gateway, so a logged-out buyer cannot use it.
- **Admin "Product Moderation" page** is 100% mocked (hard-coded array,
  local-only approve/reject), with Pending/Approved/Rejected tabs.
- **Seller "Products" page** tabs are All / Active / Out-of-Stock (stock-based),
  create goes live immediately.
- **No rating/review/feedback system exists** anywhere in the backend.

## Decisions

- **Chat with shop:** button only (stubbed "coming soon"); no chat backend.
- **Shop rating:** a derived placeholder stat from data we already have
  (units sold / product count), labeled honestly. No fake stars, no new data.
- **Existing products:** grandfathered as `approved` (catalog not wiped).
- **Shop name:** the seller's account name (`User.name`); no dedicated store-name
  field this round.
- **Scope:** delivered as one spec (both halves share the product-detail and
  seller context).

## Out of scope (YAGNI)

Real buyer↔shop chat, a real review/rating system, a public shop landing page.
Each is a separate follow-up project if wanted.

---

## Component design

### 1. Data model — `product.model.ts` (inventory service)

Add to `ProductSchema` and the `PProduct` interface:

```ts
status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
rejectionReason: { type: String },
```

- New seller-created products default to `pending` (no controller change needed —
  `createProduct` relies on the schema default).
- `seedProducts.ts` sets `status: "approved"` explicitly for demo data.
- One-time backfill: set `status: "approved"` on all existing products missing the
  field (a small idempotent script under `scripts/`, e.g.
  `backfillProductStatus.ts`, run once). Rationale: public queries filter on
  `status: "approved"`, and pre-existing docs have no value, so they must be
  backfilled or they'd disappear.

### 2. Public visibility — `product.services.ts` (inventory service)

Add `status: "approved"` to the match/filter of the public read functions:

- `getProductById` (public product page → pending/rejected 404s)
- `findProduct` (search aggregation `$match`)
- `getTopByType`
- `getTopProductPurchases`
- `getTopSale`
- `getTopPoint`
- `getTopByListType`

Mechanical, single file. Admin moderation reads through a separate path
(below) that is **not** filtered, so admins can still see pending/rejected.

### 3. Approval API — inventory service + gateway

New service functions in `product.services.ts`:

- `listProductsByStatus(status, limit?, cursor?)` — returns products of a given
  status (no approved-only filter), newest first. Used by the admin queue.
- `setProductStatus(productId, status, reason?)` — sets `status` (+ clears or sets
  `rejectionReason`); returns the updated product.

New controller handlers in `product.controller.ts` and routes in
`product.route.ts`:

- `GET /api/products/moderation?status=pending` → `handleListModeration`
- `PATCH /api/products/:productId/status` `{ status, reason? }` → `handleSetProductStatus`

> Route ordering: both must be registered **before** the existing
> `GET /:productId` catch-all so `moderation` is not captured as a product id.

Gateway (`gateway/src/routes/`): proxy both under the **admin** surface, reusing
the existing `injectInternalSecret` + IP-whitelist middleware that the other
admin routes use (admin-only). Public `product.route.ts` in the gateway is **not**
extended with these.

### 4. Shop lookup endpoints (public)

Two small public read endpoints power the "Sold by" card on the (public)
product page.

**Inventory service** — `GET /api/inventory/product/:productId`:
- Find the `Inventory` row(s) for `productId`; return the owning `sellerId` plus
  derived stats for that seller: `productCount` (number of that seller's listings)
  and `unitsSold` (sum of `numPurchases` across the seller's products).
- Precise lookup by `productId` — replaces the current fuzzy name match used by
  the product page.
- Gateway: proxy publicly via `injectInternalSecret` (same pattern as
  `GET /api/inventory/search`).

**User service** — `GET /api/sellers/:sellerId/public`:
- Public projection returning `{ name, address, avatar }` only
  (`name` from `User`, `address`/`avatar` from `UserProfile`). No phone, no
  sensitive fields.
- New service fn + controller + route; gateway proxies publicly via
  `injectInternalSecret`. The existing auth-gated `GET /api/sellers/:userId` is
  left unchanged.

### 5. Seller portal — `app/shop/(hub)/products/page.tsx` (frontend only)

- Tabs become **Pending Approval / Active / Rejected**, driven by the populated
  `product.status` already present on each inventory row. Out-of-stock is no longer
  a top-level tab; it remains visible as the existing per-row stock badge within
  the Active tab.
- A pending product shows a "Waiting for approval" badge; a rejected product shows
  its `rejectionReason`. Active = approved.
- `lib/products.ts` `BackendProduct` and `lib/seller.ts` types extended with
  `status` / `rejectionReason`.
- No backend change for this page.

### 6. Admin Moderation — `app/admin/(hub)/products/page.tsx` (frontend)

- Replace the hard-coded `PRODUCTS` array and local-only state with real data:
  - Load the queue from `GET /api/products/moderation?status=...`.
  - Approve / reject call `PATCH /api/products/:id/status` and refresh.
- Keep the existing Pending/Approved/Rejected UI, detail panel, and reject-reason
  flow. A new `lib/moderation.ts` (or additions to `lib/products.ts`) holds the
  fetch/approve/reject helpers.

### 7. Product detail — `app/products/[id]/page.tsx` (frontend)

- Add a "Sold by" card near the buy box: **shop name · location · derived stat ·
  [Chat with shop] button**.
- Data flow: `GET /api/inventory/product/:productId` → `sellerId` + stats, then
  `GET /api/sellers/:sellerId/public` → name/address. Render the derived stat
  honestly (e.g. "128 sold · 12 products"); **no star rating**.
- Chat button renders per the design system but is stubbed (disabled or a
  "coming soon" affordance).
- New helpers in `lib/seller.ts` / `lib/products.ts` for the two public calls.
- Replace the existing fuzzy `fetchInventoryByName` stock lookup with the precise
  by-product endpoint where appropriate (stock total can still be derived from the
  inventory row(s)).

---

## Design system compliance (frontend)

All new UI follows `design/design.md` (Nordic Frost): 2px Deep Navy borders, no
shadows, Neon Cyan (`primary-container`) for primary actions, 8px/16px radii,
Inter, uppercase mini-labels, status chips (rectangular, 8px radius). The "Sold
by" card and new tab/badge states reuse existing component patterns already in
these pages.

## Error handling

- Public product page: if the shop endpoints fail or the product has no inventory
  row, the "Sold by" card degrades gracefully (hidden or minimal) — the page still
  renders.
- A pending/rejected product fetched by id on the public page 404s (handled by the
  existing not-found state).
- Admin approve/reject: surface backend error messages inline; keep the panel open
  on failure (mirrors existing patterns).
- Seller portal: a missing/unknown status is treated as Pending defensively.

## Testing

- **Backend (inventory):** unit-test that public read fns exclude non-approved
  products; that `setProductStatus` flips status and sets/clears
  `rejectionReason`; that `listProductsByStatus` returns the right set; that
  `GET /api/inventory/product/:productId` returns the correct seller + stats.
- **Backend (gateway):** the moderation routes require admin (internal secret /
  IP-whitelist); the two public shop endpoints are reachable without auth.
- **Manual / integration:** seller creates a product → appears in shop "Pending"
  tab and is absent from storefront/search → admin approves → product public and
  in "Active" tab; reject path shows the reason. Product page shows the correct
  owning shop, location, derived stat, and a stubbed chat button.

## Affected files

**Backend — inventory service**
- `models/product.model.ts` (status, rejectionReason)
- `services/product.services.ts` (filters + 2 new fns + by-product lookup)
- `controllers/product.controller.ts` (moderation handlers; by-product handler)
- `routes/product.route.ts` and `routes/inventory.route.ts` (new routes)
- `scripts/seedProducts.ts` (+ new `scripts/backfillProductStatus.ts`)

**Backend — user service**
- `services/seller.services.ts`, `controllers/...`, `routes/...` (public shop
  projection)

**Backend — gateway**
- `routes/product.route.ts` / `routes/inventory.route.ts` (public by-product)
- `routes/seller.route.ts` (public shop)
- admin proxy route (moderation list + set-status)

**Frontend**
- `app/products/[id]/page.tsx` (Sold-by card)
- `app/shop/(hub)/products/page.tsx` (approval tabs/badges)
- `app/admin/(hub)/products/page.tsx` (wire to real API)
- `lib/products.ts`, `lib/seller.ts` (+ optional `lib/moderation.ts`) (types + helpers)
