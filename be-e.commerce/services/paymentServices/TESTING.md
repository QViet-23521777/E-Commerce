# Testing the MoMo Payment Service

## What you need

- Node.js 18+
- MongoDB running locally (or use [MongoDB Atlas free tier](https://www.mongodb.com/cloud/atlas))
- VS Code with the **REST Client** extension installed (by Huachao Mao)

---

## Step 1 — Setup

```bash
cd be-e.commerce/services/paymentServices
npm install
cp .env.example .env
```

Open `.env`. Most values are already filled in with sandbox credentials. The only thing you may need to change:

| Variable | What to do |
|----------|-----------|
| `MONGODB_URI` | If MongoDB is not on localhost, update this |
| `INTERNAL_SECRET` | Leave as `test-secret-123` (must match across services if running full stack) |
| `MOMO_IPN_URL` | See Step 3 below |

---

## Step 2 — Start the service

```bash
npm run dev
```

You should see:
```
Connected to MongoDB
Payment service is running on http://localhost:3005
```

Test it's alive:
```
GET http://localhost:3005/health
```

---

## Step 3 — (Optional) Set up ngrok for IPN callbacks

MoMo's server needs to call back to your machine to confirm payment. This won't work with `localhost`.

**Without ngrok:** Payment status stays `pending` after you pay — use the `/sync` endpoint (step 7 in the `.http` file) to manually fetch the status from MoMo.

**With ngrok (recommended for full flow):**

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3005`
3. Copy the `https://` URL it gives you
4. In `.env`, set:
   ```
   MOMO_IPN_URL=https://YOUR_ID.ngrok-free.app/api/payments/momo/ipn
   ```
5. Restart the service

---

## Step 4 — Run the tests

Open `payment-test.http` in VS Code. You'll see **Send Request** above each block — click it to run.

### Happy path (run in this order):

**1. Check available payment methods**
```
### 2. Get available payment methods
```
Should return: `wallet`, `atm`, `credit_card`, `momo_methods`

---

**2. Create a payment**
```
### 3. Create payment — fixed amount (MoMo wallet)
```
Response will include:
```json
{
  "data": {
    "orderId": "abc-123-...",
    "payUrl": "https://test-payment.momo.vn/...",
    "qrCodeUrl": "...",
    "status": "pending"
  }
}
```

Copy the `orderId` value. Paste it at the top of `payment-test.http`:
```
@orderId = abc-123-...
```

Open `payUrl` in your browser to complete the sandbox payment.

**MoMo sandbox test credentials (on the payment page):**
- Phone: `0000000000`
- OTP: `000000`
- PIN: `000000`

---

**3. Check payment status**
```
### 6. Get payment status by orderId
```

If status is still `pending` after paying (IPN not set up), run:
```
### 7. Sync payment status from MoMo
```

Status should become `paid`.

---

**4. Refund**
```
### 8. Refund full amount
```

Payment must be `paid` first. Status will become `refunded`.

---

**5. View history**
```
### 10. Payment history
```

---

## All endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/payments/methods` | List payment methods |
| POST | `/api/payments/momo/create` | Create a payment session |
| GET | `/api/payments/:orderId` | Get payment by orderId |
| POST | `/api/payments/:orderId/sync` | Pull latest status from MoMo |
| POST | `/api/payments/:orderId/refund` | Refund a payment |
| GET | `/api/payments/history` | List user's payment history |
| POST | `/api/payments/momo/ipn` | MoMo IPN webhook (called by MoMo) |

## Required headers

Every request needs:
```
x-internal-secret: test-secret-123
```

Routes that involve a user also need:
```
x-user-id: user-001
```

---

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` | Wrong or missing `x-internal-secret` | Make sure header matches `INTERNAL_SECRET` in `.env` |
| `401 Unauthorized` | Missing `x-user-id` header | Add `x-user-id` header |
| `MOMO_PARTNER_CODE is not configured` | `.env` not loaded | Make sure `.env` exists and `npm run dev` was restarted |
| `Payment not found` | Wrong `orderId` or wrong `x-user-id` | The orderId must belong to the user in `x-user-id` |
| `Only paid payments can be refunded` | Payment not paid yet | Run sync first, or complete payment on MoMo page |
| `MongooseServerSelectionError` | MongoDB not running | Start MongoDB: `mongod` or start Docker |
