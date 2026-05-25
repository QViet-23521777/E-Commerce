# Integration Guide — Connect Frontend to Backend

> **Who this is for:** Claude (next session), tasked with replacing mock data in the Next.js frontend with real API calls to the microservices backend.
>
> **Constraint:** The backend is a friend's code — minimize changes to `be-e.commerce/`. All integration work happens in `fe-e.commerce/`.
>
> **Do not start coding without reading this entire file first.**

---

## 1. Architecture Overview

```
Browser → fe-e.commerce (Next.js, port ~3001)
               ↓ fetch/axios to http://localhost:3000
         be-e.commerce/gateway (Hono.js, port 3000)
               ↓ proxies internally
     ┌─────────────────────────────────────┐
     │  user-service:3001  (auth, profiles)│
     │  mail-service:3002  (email)         │
     │  inventory-service:3003 (products)  │
     │  activity-service:3004 (tracking)   │
     │  payment-service:3005 (MoMo/wallet) │
     │  promotion-service:3006 (coupons)   │
     └─────────────────────────────────────┘
           ↓ all share
     MongoDB + Redis + Kafka (via Docker)
```

The frontend **only talks to the Gateway at port 3000**. Never call individual services directly.

---

## 2. Critical Gaps — Missing Backend Features

The backend does NOT have implementations for these frontend features. Do not attempt to wire them up — leave as mock data and add a `// TODO: no backend endpoint` comment:

| Frontend Feature | Status | Notes |
|---|---|---|
| Shopping cart | **MISSING** | No cart service. Backend jumps from product browse → payment directly |
| Order history / tracking | **MISSING** | Payment records exist but no order status machine (to_confirm → shipped → delivered) |
| Product reviews & ratings | **MISSING** | No review model, no endpoint |
| Wishlist | **MISSING** | No wishlist model or endpoint |
| Address book | **MISSING** | No address model or endpoint |
| Chat | **MISSING** | No chat service at all |
| Seller finance/reporting | **MISSING** | No aggregated revenue or financial endpoints |
| Admin dashboard stats | **MISSING** | No platform-wide analytics endpoint |
| Category management (admin) | **PARTIAL** | Products have a `type` string field, no formal category model |
| Seller dashboard KPIs | **PARTIAL** | No `/seller/dashboard` summary endpoint |
| Forgot password UI | **WORKS** | Backend has full flow — integrate this one |

---

## 3. What CAN Be Integrated (Priority Order)

### Priority 1 — Authentication (unlocks everything else)
### Priority 2 — Product browsing (search, product detail, home page)  
### Priority 3 — User profile (read-only data)
### Priority 4 — Seller product management (CRUD)
### Priority 5 — Payments & promotions
### Priority 6 — Activity tracking (background, non-blocking)

---

## 4. Frontend Setup Before Any Integration

### 4a. Install dependencies
```bash
cd fe-e.commerce
npm install axios
```

### 4b. Create API client
Create `fe-e.commerce/lib/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

// Attach JWT from cookie to every request
api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
```

### 4c. Environment variable
File `fe-e.commerce/.env.local` must contain:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 5. Authentication Integration

### Current (mock)
- Login sets a cookie `auth_token=mock_token` locally
- Middleware checks if cookie exists (any value is fine)

### Target (real)
- Login calls `POST /api/users/login` → gets real JWT
- Store JWT in `auth_token` cookie (keep same name — middleware already uses it)
- The JWT must be sent as `Authorization: Bearer <token>` header on protected requests
- Handle 401 responses to redirect to login

### Files to change

#### `fe-e.commerce/app/login/page.tsx`
Replace mock validation block with:
```typescript
import api from '@/lib/api';

// In the handleSubmit / handleLogin function:
try {
  const res = await api.post('/api/users/login', { email, password });
  const { token } = res.data; // verify exact field name in backend response
  
  // Store JWT in cookie (same name middleware expects)
  document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
  
  router.push(searchParams.get('from') || '/');
} catch (err) {
  setError('Invalid email or password');
}
```

> **Check the actual response shape** from `be-e.commerce/services/userServices/src/controllers/` login controller before assuming field names.

#### `fe-e.commerce/app/signup/page.tsx`
Replace mock with:
```typescript
const res = await api.post('/api/users/register', {
  name: fullName,
  email,
  password,
});
// After registration, user needs to verify email (backend sends verification email)
// Show "Check your email" message instead of auto-login
```

#### `fe-e.commerce/app/forgot-password/page.tsx`
This is fully supported by backend:
- Step 1: `POST /api/users/send-reset-password-email` with `{ email }`
- Step 2 (after clicking email link): `POST /api/users/verify-resetpassword?token=<token>` with new password

#### Shop login — `fe-e.commerce/app/shop/login/page.tsx`
The seller login uses the **same** `POST /api/users/login` endpoint. The response JWT will have role `seller`. After login:
```typescript
document.cookie = `shop_token=${token}; path=/; max-age=${...}`;
```

#### Admin login — `fe-e.commerce/app/admin/login/page.tsx`
Admin login uses `POST /api/admin/login`. **Important:** The backend enforces IP whitelisting for admin. During development on localhost this works. In production, the gateway's `ADMIN_ALLOWED_IPS` env var must include the request IP.
```typescript
document.cookie = `admin_token=${token}; path=/; max-age=${...}`;
```

---

## 6. Product Browsing Integration

### Home page — `fe-e.commerce/app/page.tsx`
Replace hardcoded product arrays with:
```typescript
// Top products by category
GET /api/products/top/purchases   → flash deals / bestsellers
GET /api/products/top/sale        → discounted items section
GET /api/products/top/type/:type  → category sections (pass product type name)
GET /api/products/top/list-type   → get all available category types
```

### Search page — `fe-e.commerce/app/search/page.tsx`
Replace hardcoded products with:
```typescript
GET /api/products/search?q=<query>&limit=24
// Note: backend search returns products. The frontend also filters by material/category/price —
// these filters may need to be applied client-side until the backend supports them.
```

### Product detail — `fe-e.commerce/app/products/[id]/page.tsx`
```typescript
GET /api/products/<productId>    → product info (name, description, price, sale, imageUrl, type, point)
GET /api/inventory/search?name=  → for checking stock (cross-reference by product name/ID)
```
> **Note:** Backend Product model has: `name`, `description`, `price`, `sale` (discount %), `imageUrl`, `type`, `point`. It does NOT have: multiple images, specs tabs, material, dimensions. Show only what exists.

### Related products
```typescript
GET /api/products/top/type/:type  → products of same type as the viewed product
// Show top 3-4 as "You May Also Like"
```

---

## 7. User Profile Integration

### `fe-e.commerce/app/profile/page.tsx`

```typescript
// Get profile
GET /api/users/profile   → { name, email, ... } (requires auth_token header)

// Update profile
PUT /api/users/profile   → send updated fields
```

**What backend returns vs what frontend shows:**
- Backend `UserProfile` model: `userId`, `walletId`, `avatar`, `phone`, `address` (single string), `preferences`, `searchHistory`
- Frontend shows: address book (multiple addresses), wishlist, vouchers, order history
- **Conclusion:** Only wire up the personal info tab (name, email, phone, avatar). Keep wishlist, address book, vouchers as mock — no backend support.

---

## 8. Seller Product Management Integration

### `fe-e.commerce/app/shop/(hub)/products/page.tsx`

```typescript
// List seller's products (via inventory)
GET /api/inventory/seller/:sellerId   → list of inventory items

// Create product + inventory
POST /api/products/     → creates product record (returns productId)
POST /api/inventory/    → links product to seller with stock quantity

// Update stock
PUT /api/inventory/:inventoryId/quantity   → { quantity: number }

// Delete inventory
DELETE /api/inventory/:inventoryId
```

> **Seller ID:** After seller login, decode the JWT to get `userId`, then call `GET /api/sellers/:userId` to get shop info including sellerId.

### `fe-e.commerce/app/shop/(hub)/orders/page.tsx`
- **No backend order management endpoints exist.** Leave as mock with `// TODO: no order service`.

### `fe-e.commerce/app/shop/(hub)/dashboard/page.tsx`
- Revenue chart, KPIs: **no endpoints** — leave mock.
- Low stock alerts: `GET /api/inventory/seller/:sellerId` → filter for items where `quantity < threshold`.

---

## 9. Promotion / Coupon Integration

### `fe-e.commerce/app/cart/page.tsx` and `fe-e.commerce/app/checkout/page.tsx`

The cart and checkout coupon inputs can hit the real promotion service:

```typescript
// Validate a promo code (does not consume it)
POST /api/promotions/validate
Body: { code: "FROST25", userId: "<userId>", orderAmount: 150.00 }
Returns: { valid: true, discountType: "percentage", discountValue: 25, ... }

// Redeem (consume the promo)
POST /api/promotions/redeem
Body: { code: "FROST25", userId: "<userId>", orderAmount: 150.00 }
```

```typescript
// Show available promotions
GET /api/promotions/active   → list of current active promotions
```

> This is one of the cleanest integrations — the backend promotion model exactly matches what the frontend needs.

---

## 10. Payment Integration

### `fe-e.commerce/app/checkout/page.tsx`

The payment step currently shows card/Apple Pay/Google Pay tabs. The real backend only supports:
1. **MoMo Wallet** (Vietnamese payment)
2. **In-app Wallet** (virtual balance)

Change the payment method tabs to "MoMo" and "Wallet" instead.

```typescript
// MoMo payment
POST /api/payments/momo/create
Body: {
  orderId: "<unique_order_id>",
  amount: 150000,    // in VND (Vietnamese Dong)
  orderInfo: "Payment for order",
  items: [{ productId, name, quantity, unitPrice, totalPrice }]
}
Returns: { payUrl: "https://payment.momo.vn/..." }
// Redirect user to payUrl to complete payment
// MoMo will redirect back to MOMO_REDIRECT_URL after completion

// Wallet payment
POST /api/payments/wallet/checkout
Body: { amount, items: [...] }

// Check payment status
GET /api/payments/:orderId
```

> **Currency note:** The entire backend uses VND (Vietnamese Dong). The frontend shows USD symbols (`$`). Either change to VND or add a conversion layer — but this is a cosmetic change, not blocking.

---

## 11. Activity Tracking (Background, Non-Blocking)

Fire-and-forget — these should not block the UI. Wrap in `try/catch` and never await in render:

```typescript
// When user views a product
api.post('/api/activities', {
  userId,
  activity: 'view',
  productId
}).catch(() => {}); // silently ignore failures

// When user searches
api.post('/api/activities', {
  userId,
  activity: 'search',
  keyword: searchQuery
}).catch(() => {});

// When user buys
api.post('/api/activities', {
  userId,
  activity: 'buy',
  productId
}).catch(() => {});
```

Once activity data accumulates, personalized recommendations become available:
```typescript
POST /api/products/recommend/:userId   → personalized product list
```

---

## 12. Wallet Integration

The backend has a full wallet service. The frontend profile page can show wallet balance:

```typescript
// Create wallet (call once after registration)
POST /api/wallets/
// Returns wallet info

// Get balance
GET /api/wallets/
// Returns { balance: number }

// Top up wallet
POST /api/wallets/credit
Body: { amount: number }
```

Add a "Wallet Balance" card to the profile overview tab.

---

## 13. JWT Token Management

### Decoding the token
The JWT contains user information. Decode it client-side (no verification needed, just decode payload):
```typescript
// fe-e.commerce/lib/auth.ts
export function decodeToken(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload; // { userId, email, role, ... }
  } catch {
    return null;
  }
}
```

### Token refresh
JWT expires in 15 minutes. Backend issues a `refreshToken` (7 days). Add a refresh interceptor to `lib/api.ts`:
```typescript
api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = getCookieValue('refresh_token');
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/refresh-token`, 
          { refreshToken });
        const newToken = res.data.token;
        document.cookie = `auth_token=${newToken}; path=/`;
        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      } catch {
        // Refresh failed — redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 14. File-by-File Integration Checklist

| File | Priority | Action |
|---|---|---|
| `lib/api.ts` | **1** | Create — API client with auth interceptor |
| `lib/auth.ts` | **1** | Create — JWT decode helper, getCookieValue |
| `app/login/page.tsx` | **1** | Replace mock → `POST /api/users/login` |
| `app/signup/page.tsx` | **1** | Replace mock → `POST /api/users/register` |
| `app/forgot-password/page.tsx` | **2** | Wire up reset flow (backend supports it fully) |
| `app/shop/login/page.tsx` | **2** | Same login endpoint, set shop_token cookie |
| `app/admin/login/page.tsx` | **2** | `POST /api/admin/login` |
| `app/page.tsx` | **3** | Replace hardcoded products → top/search endpoints |
| `app/search/page.tsx` | **3** | `GET /api/products/search?q=` |
| `app/products/[id]/page.tsx` | **3** | `GET /api/products/:id` |
| `app/profile/page.tsx` | **4** | Wire personal info tab only |
| `app/shop/(hub)/products/page.tsx` | **4** | Wire CRUD via inventory endpoints |
| `app/checkout/page.tsx` | **5** | Add promo validation + MoMo/Wallet payment |
| `app/cart/page.tsx` | **5** | Add promo validation only (no cart backend) |
| All other pages | — | Leave mock, add `// TODO: no backend endpoint` |

---

## 15. Backend Response Shape — Key Endpoints

Verify these before coding (check controller files in `be-e.commerce/services/`):

### Login response
Check `be-e.commerce/services/userServices/src/controllers/` for the login controller.
Expected shape (verify): `{ token: string, refreshToken: string, user: { id, email, name, role } }`

### Product response
Check `be-e.commerce/services/inventoryServices/src/controllers/product.controller.ts`.
Model fields: `name`, `normalize`, `description`, `price`, `sale`, `imageUrl`, `type`, `point`, `numPurchases`

### Inventory response
Model fields: `_id`, `name`, `sellerId`, `productId`, `quantity`, `createdAt`

### Promotion validate response
Check `be-e.commerce/services/promotionServices/src/controllers/`.
Model fields: `code`, `discountType`, `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `active`

---

## 16. Common Mistakes to Avoid

1. **Don't call service ports directly** — always go through gateway port 3000
2. **Don't store sensitive data in localStorage** — use httpOnly cookies when possible
3. **Don't block UI while tracking activity** — fire and forget, never await
4. **Don't assume endpoint paths** — verify against `be-e.commerce/gateway/src/routes/` files
5. **Don't change backend code** — all changes in `fe-e.commerce/`
6. **Don't integrate missing features** — cart, orders, wishlist have no backend; leave mock
7. **Currency is VND** — backend amounts are integers in Vietnamese Dong, not USD floats

---

## 17. Testing Integration

Use the Postman collection at `be-e.commerce/ECommerce_API_Collection.postman_collection.json` to test backend endpoints before wiring them. Set variable `base_url = http://localhost:3000`.

Test flow:
1. Register a test user via Postman
2. Login and copy the JWT token
3. Test product search
4. Then wire the frontend
