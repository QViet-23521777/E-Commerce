# Homepage Redesign — Classic Marketplace

**Date:** 2026-05-25  
**Branch:** Tan  
**Status:** Approved

## Overview

Replace the current minimalist lifestyle homepage with a wide-category marketplace homepage in the style of Shopee/Lazada/Amazon. All data is static/hardcoded (no API integration in this pass). The Nordic Frost design system applies throughout.

## Page Sections (top → bottom)

### 1. Announcement Bar *(unchanged)*
Keep existing ticker bar: "FREE SHIPPING..." on deep navy background with neon cyan text.

### 2. Navbar *(unchanged)*
No modifications.

### 3. Hero Banner
- **Desktop:** Two-column split. Left (~60%): large primary promo card with background fill, headline (e.g. "Summer Sale Up to 70% Off"), sub-copy, primary CTA button. Right (~40%): two stacked smaller promo cards (e.g. "New Electronics" and "Fresh Groceries").
- **Mobile:** Stacks vertically, primary first.
- Styling: bold navy borders, neon cyan CTA buttons, Inter typography at display sizes.

### 4. Category Icon Row
- Horizontally scrollable row, ~10 chips, no wrapping.
- Each chip: circular icon container (48px) + label below.
- Click navigates to `/search?category=<slug>`.
- Categories: Electronics, Fashion, Food & Grocery, Home & Living, Health & Beauty, Sports & Outdoors, Books, Toys & Baby, Automotive, Pet Supplies.
- Uses Lucide icons (one per category).

### 5. Flash Deals Strip
- Full-width navy background band.
- Left: "FLASH DEALS" label (neon cyan, label-caps) + static countdown display (e.g. "02:34:17").
- Right: horizontal scroll of 6 product cards showing sale price + original strikethrough.
- Cards: compact version of ProductCard (image, name, sale price, original price, discount badge).

### 6. Shop by Category (×3 zones)
Three stacked zones. Each zone:
- Header row: bold category name (headline-md) + "See All →" link to `/search?category=<slug>`.
- 4-column product grid (lg: 4 cols, md: 2 cols, sm: 1 col).
- Products: 4 per zone, hardcoded.
- Zones: **Electronics**, **Women's Fashion**, **Food & Grocery**.

### 7. Just for You
- Section heading + 5-column product grid (xl: 5, lg: 4, md: 3, sm: 2).
- 20 hardcoded product cards, random mix of categories.
- No pagination or load-more.

### 8. Footer *(unchanged)*

## Components

| Component | Location | Reused in |
|-----------|----------|-----------|
| `ProductCard` | `components/ProductCard.tsx` | Flash Deals, Category Zones, Just for You |
| `CategoryChip` | `components/CategoryChip.tsx` | Category Icon Row |
| `HeroBanner` | `components/HeroBanner.tsx` | Hero section only |
| `FlashDealsSection` | `components/FlashDealsSection.tsx` | Flash Deals strip |
| `CategorySection` | `components/CategorySection.tsx` | Each of the 3 category zones |

`Navbar` and `Footer` are unchanged.

## Design Constraints

- Nordic Frost colors: background `#ffffff`, text `#001A41` (deep navy), accent `#00F3FF` (neon cyan).
- Borders: 1px navy on cards, 2px navy on structural containers.
- No box shadows — tonal layering only.
- Inter font, all typographic scale from design.md.
- Max container: 1280px centered with 40px side margins (desktop), 16px (mobile).
- Animations: framer-motion `fadeUp` + `staggerContainer` (same pattern as current page).

## Out of Scope

- API integration (products/categories are hardcoded).
- Search functionality beyond href navigation.
- Cart add actions (button present, no handler).
- Countdown timer logic (static display only).
