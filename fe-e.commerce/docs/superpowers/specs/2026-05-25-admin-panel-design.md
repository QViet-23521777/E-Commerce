# Admin Panel Design Spec

**Goal:** Build a fully static admin panel at `/admin/...` for platform operators to manage accounts, categories, feedback, and product approvals.

**Architecture:** Mirrors the existing Seller Hub (`/shop/...`) — cookie-based mock auth, deep-navy sidebar, shared Nordic Frost design tokens, all data hardcoded as static mock arrays.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, framer-motion (motion/react), lucide-react.

---

## Route Structure

```
fe-e.commerce/app/admin/
  login/page.tsx                  — Admin login (mock creds: admin@shopin.com / admin123)
  (hub)/layout.tsx                — Protected layout with AdminSidebar
  (hub)/dashboard/page.tsx        — Platform KPI overview
  (hub)/accounts/page.tsx         — Account list + detail panel
  (hub)/categories/page.tsx       — Category tree + edit form
  (hub)/feedback/page.tsx         — Feedback list + detail panel
  (hub)/products/page.tsx         — Product moderation queue
fe-e.commerce/components/AdminSidebar.tsx  — Sidebar (reuses ShopSidebar pattern)
fe-e.commerce/middleware.ts (existing)     — Add /admin/* route protection
```

## Auth

- Login page at `/admin/login` with mock credentials `admin@shopin.com` / `admin123`
- On success: set cookie `admin_token=mock-admin-token; path=/; max-age=86400`, redirect to `/admin/dashboard`
- Middleware guards `/admin/(hub)/*` — if no `admin_token` cookie, redirect to `/admin/login`
- Logout: clear `admin_token` cookie, redirect to `/admin/login`

## Components

### AdminSidebar
Exact same structure as `ShopSidebar`:
- Deep-navy background, sticky, `w-[240px]`
- Logo: "ShopIn" + "Admin" badge (red instead of seller's teal to distinguish)
- Nav items with lucide icons: Dashboard (LayoutDashboard), Accounts (Users), Categories (FolderTree), Feedback (MessageSquare), Products (Package)
- Active state: `bg-primary-container text-deep-navy`
- Bottom: "Platform Admin" identity + logout button
- Mobile: hamburger + slide-in drawer (AnimatePresence)

### Shared patterns (no new components needed)
- KPI card: same `bg-white border-2 border-deep-navy rounded-xl p-5` pattern from seller dashboard
- Data table: same `<table>` with `bg-surface-container-low` thead, `divide-y divide-outline-variant` rows
- Status badge: `inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border`
- Detail panel: slides in from right as `fixed` overlay with `border-l-2 border-deep-navy bg-white`

## Pages

### Dashboard (`/admin/dashboard`)
KPI cards (4):
- Total Users: 3,842 (+124 this week)
- Total Products: 12,480 (247 pending)
- Pending Approvals: 12 (needs attention)
- Open Feedback: 34 (8 urgent)

Charts:
- Monthly new user registrations (bar chart, same CSS approach as seller dashboard)
- Side panel: "Pending Product Approvals" quick list (5 items, link to /admin/products)

Recent signups table: name, email, role (buyer/seller), joined date, status badge.

### Account Management (`/admin/accounts`)
Left: full-width table with columns: Avatar+Name, Email, Role, Status (Active/Suspended), Joined, Actions (View button).
- Filter chips: All / Buyers / Sellers / Admins
- Search input (static, no filtering logic needed)
- 15 mock accounts (mix of buyer/seller/admin roles)

Right: slide-in detail panel (triggered by clicking View):
- Header: avatar circle + name + role badge
- Sections: Contact info, Account stats (orders placed/received, rating), Action buttons: Suspend Account / Activate Account (toggle, visual feedback only)

### Category Management (`/admin/categories`)
Two-column layout (left 40% / right 60%):

Left: category tree list
- 10 parent categories (same as BROWSE_CATEGORIES from homepage)
- Each row: icon + name + child count + Edit/Delete icon buttons
- "Add Category" button at top
- Clicking a row selects it (highlight with primary-container border)

Right: edit form panel (shown when a category is selected)
- Fields: Name (text input), Slug (text input, auto-derives from name), Icon (dropdown of 10 lucide icon names), Parent Category (dropdown or "Top Level")
- Save / Cancel buttons
- Visual feedback on save ("Saved!" state for 2 seconds)

### Feedback Management (`/admin/feedback`)
Table: Author, Subject, Rating (stars), Status (Open/Resolved), Date, Actions (View).
- Filter chips: All / Open / Resolved
- 20 mock feedback entries

Detail panel (slide-in):
- Header: author + date + star rating
- Body: full feedback message text
- "Mark as Resolved" button (toggles status visually)
- Reply section: textarea + Send Reply button (visual only)

### Product Moderation (`/admin/products`)
Table: Product image thumbnail + Name, Seller, Category, Price, Submitted, Status (Pending/Approved/Rejected), Actions.
- Filter chips: All / Pending / Approved / Rejected
- 15 mock products

Detail panel (slide-in):
- Product image (full width in panel)
- Name, seller, category, price, description
- Action buttons: Approve (neon cyan) / Reject (red outline)
- Rejection reason textarea (shown when Reject is clicked)
- Confirm Rejection button

## Styling Rules
- All cards: `bg-white border-2 border-deep-navy rounded-xl`
- Table headers: `bg-surface-container-low` with `text-label-caps text-on-surface-variant`
- Active nav: `bg-primary-container text-deep-navy font-bold`
- Admin badge color: `text-red-500 border-red-300 bg-red-50` (distinguishes admin from seller)
- All animations: `motion/react` with `EASE = [0.23, 1, 0.32, 1]`
- Detail panels: `fixed right-0 top-0 h-full w-[400px] bg-white border-l-2 border-deep-navy z-50`
