# Payment Service Diagrams

This document explains how the `paymentServices` module works with MoMo through the API gateway.

## Main Endpoints

The frontend should call the gateway endpoints, not the payment service directly.

| Action | Gateway endpoint | Purpose |
| --- | --- | --- |
| List payment methods | `GET /api/payments/methods` | Returns supported MoMo methods. |
| Create payment | `POST /api/payments/momo/create` | Creates a payment record and returns MoMo `payUrl`. |
| Receive MoMo IPN | `POST /api/payments/momo/ipn` | MoMo calls this after payment result is known. |
| View payment history | `GET /api/payments/history` | Returns authenticated user's payment history. |
| View one payment | `GET /api/payments/:orderId` | Returns one authenticated user's payment status. |
| Sync from MoMo | `POST /api/payments/:orderId/sync` | Queries MoMo and updates local payment status. |
| Refund payment | `POST /api/payments/:orderId/refund` | Sends refund request to MoMo and updates refund state. |

## Payment Methods

| `paymentMethod` | MoMo `requestType` | Description |
| --- | --- | --- |
| `wallet` | `captureWallet` | Pay with MoMo E-Wallet. |
| `atm` | `payWithATM` | Pay with domestic ATM card. |
| `credit_card` | `payWithCC` | Pay with credit card. |
| `momo_methods` | `payWithMethod` | MoMo hosted page lets user choose a method. |

## Activity Diagram

```mermaid
flowchart TD
    A[Customer chooses payment method] --> B[Frontend sends POST /api/payments/momo/create]
    B --> C[Gateway verifies JWT]
    C --> D[Gateway forwards request with internal secret and user headers]
    D --> E[Payment service validates amount, items, method, and language]
    E --> F{Items included?}

    F -->|Yes| G[Fetch product snapshots from inventory service]
    G --> H[Recalculate total from product prices and quantities]
    H --> I{Provided amount matches computed amount?}
    I -->|No| I1[Reject request]
    I -->|Yes| J[Create pending payment record in MongoDB]

    F -->|No| K[Use provided amount]
    K --> J

    J --> L[Build orderId, requestId, extraData]
    L --> M[Create HMAC SHA256 signature]
    M --> N[Call MoMo create API]
    N --> O{MoMo resultCode is 0?}

    O -->|No| P[Mark payment failed]
    P --> Q[Return failure response]

    O -->|Yes| R[Save payUrl, deeplink, qrCodeUrl, MoMo response]
    R --> S[Return payment data to frontend]
    S --> T[Frontend redirects customer to MoMo payUrl]
    T --> U[Customer completes or cancels payment on MoMo]

    U --> V[MoMo sends IPN to /api/payments/momo/ipn]
    V --> W[Gateway forwards IPN to payment service]
    W --> X[Payment service verifies MoMo IPN signature]
    X --> Y{Signature, partnerCode, and amount are valid?}

    Y -->|No| Z[Reject IPN]
    Y -->|Yes| AA{IPN resultCode is 0?}

    AA -->|Yes| AB[Mark payment paid and save transId]
    AA -->|No| AC[Mark payment failed]

    AB --> AD[Frontend checks GET /api/payments/:orderId]
    AC --> AD
    AD --> AE[Show final status to customer]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant FE as Frontend
    participant GW as API Gateway
    participant PS as Payment Service
    participant INV as Inventory Service
    participant DB as MongoDB
    participant MOMO as MoMo Gateway

    Customer->>FE: Choose payment method and checkout
    FE->>GW: POST /api/payments/momo/create
    Note over FE,GW: Authorization: Bearer accessToken

    GW->>GW: Verify JWT
    GW->>PS: Forward create request
    Note over GW,PS: x-internal-secret, x-user-id, x-user-email, x-user-role

    PS->>PS: Validate request body
    alt Request has items
        PS->>INV: GET /api/products/:productId
        INV-->>PS: Product price and name
        PS->>PS: Recalculate amount
    else Request has amount only
        PS->>PS: Use provided amount
    end

    PS->>DB: Insert payment with status pending
    DB-->>PS: Payment record
    PS->>PS: Build rawSignature and HMAC SHA256 signature
    PS->>MOMO: POST /v2/gateway/api/create
    MOMO-->>PS: resultCode, payUrl, deeplink, qrCodeUrl
    PS->>DB: Save MoMo create response
    PS-->>GW: Payment response
    GW-->>FE: Payment response
    FE->>Customer: Redirect to payUrl

    Customer->>MOMO: Pay on MoMo page
    MOMO->>GW: POST /api/payments/momo/ipn
    GW->>PS: Forward IPN
    PS->>PS: Verify IPN signature
    PS->>DB: Find payment by orderId
    DB-->>PS: Payment record

    alt resultCode is 0
        PS->>DB: Update status to paid and save transId
    else resultCode is not 0
        PS->>DB: Update status to failed
    end

    PS-->>GW: 204 No Content
    GW-->>MOMO: 204 No Content

    FE->>GW: GET /api/payments/:orderId
    GW->>PS: Forward status request
    PS->>DB: Find payment by orderId and userId
    DB-->>PS: Payment status
    PS-->>GW: Payment status
    GW-->>FE: Payment status
    FE->>Customer: Show paid, pending, or failed
```

## History, Sync, And Refund Flow

```mermaid
flowchart TD
    A[Frontend requests payment support action] --> B{Action}

    B -->|History| C[GET /api/payments/history]
    C --> D[Gateway verifies JWT]
    D --> E[Payment service queries payments by userId, status, method, page, limit]
    E --> F[Return paginated history]

    B -->|Sync| G[POST /api/payments/:orderId/sync]
    G --> H[Gateway verifies JWT]
    H --> I[Payment service loads payment by orderId and userId]
    I --> J[Call MoMo query API]
    J --> K[Save query response]
    K --> L[Update local status if MoMo result is final]
    L --> M[Return updated payment]

    B -->|Refund| N[POST /api/payments/:orderId/refund]
    N --> O[Gateway verifies JWT]
    O --> P[Payment service checks payment belongs to user]
    P --> Q{Payment is paid and has transId?}
    Q -->|No| R[Reject refund]
    Q -->|Yes| S[Validate refund amount]
    S --> T[Call MoMo refund API]
    T --> U[Save refund record]
    U --> V{Refund success?}
    V -->|Full refund| W[Mark payment refunded]
    V -->|Partial refund| X[Mark payment partially_refunded]
    V -->|Failed refund| Y[Keep payment paid and save refund response]
```
