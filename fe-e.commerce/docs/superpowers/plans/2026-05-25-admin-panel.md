# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully static admin panel at `/admin/...` with login, dashboard, account management, category management, feedback management, and product moderation pages.

**Architecture:** Mirrors the Seller Hub (`/shop/...`) — cookie-based mock auth, a shared `AdminSidebar` component, protected route group `(hub)`, all data hardcoded as static mock arrays following Nordic Frost design tokens.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS v4, framer-motion (motion/react), lucide-react.

---

### Task 1: AdminSidebar component

**Files:**
- Create: `fe-e.commerce/components/AdminSidebar.tsx`

- [ ] Create `fe-e.commerce/components/AdminSidebar.tsx`

- [ ] Commit: `git add fe-e.commerce/components/AdminSidebar.tsx && git commit -m "feat(admin): AdminSidebar component"`

---

### Task 2: Admin login page

**Files:**
- Create: `fe-e.commerce/app/admin/login/page.tsx`

- [ ] Create `fe-e.commerce/app/admin/login/page.tsx`

- [ ] Commit: `git add fe-e.commerce/app/admin/login && git commit -m "feat(admin): login page with mock credentials"`

---

### Task 3: Admin layout (hub route group)

**Files:**
- Create: `fe-e.commerce/app/admin/layout.tsx`
- Create: `fe-e.commerce/app/admin/(hub)/layout.tsx`

- [ ] Create both layout files

- [ ] Commit

---

### Task 4: Dashboard page

**Files:**
- Create: `fe-e.commerce/app/admin/(hub)/dashboard/page.tsx`

- [ ] Create dashboard page

- [ ] Commit

---

### Task 5: Account Management page

**Files:**
- Create: `fe-e.commerce/app/admin/(hub)/accounts/page.tsx`

- [ ] Create accounts page with detail panel

- [ ] Commit

---

### Task 6: Category Management page

**Files:**
- Create: `fe-e.commerce/app/admin/(hub)/categories/page.tsx`

- [ ] Create categories page

- [ ] Commit

---

### Task 7: Feedback Management page

**Files:**
- Create: `fe-e.commerce/app/admin/(hub)/feedback/page.tsx`

- [ ] Create feedback page with detail panel

- [ ] Commit

---

### Task 8: Product Moderation page

**Files:**
- Create: `fe-e.commerce/app/admin/(hub)/products/page.tsx`

- [ ] Create product moderation page with detail panel

- [ ] Commit

---

### Task 9: Middleware update

**Files:**
- Modify: `fe-e.commerce/middleware.ts`

- [ ] Add `/admin/(hub)/*` protection (redirect to `/admin/login` if no `admin_token` cookie)
- [ ] Also add `/shop/(hub)/*` protection (redirect to `/shop/login` if no `shop_token` cookie)

- [ ] Commit
