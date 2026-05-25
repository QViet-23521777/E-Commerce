"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openapiSpec = void 0;
exports.openapiSpec = {
    openapi: "3.0.3",
    info: {
        title: "Gateway API",
        version: "1.0.0",
        description: "OpenAPI documentation for API Gateway. Most endpoints proxy to underlying services.",
    },
    servers: [{ url: "/" }],
    tags: [
        { name: "Health" },
        { name: "Users" },
        { name: "Admin" },
        { name: "Products" },
        { name: "Payments" },
        { name: "Activities" },
        { name: "Permissions" },
    ],
    components: {
        securitySchemes: {
            BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            RegisterRequest: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", example: "Nguyen Van A" },
                    email: { type: "string", format: "email", example: "a@example.com" },
                    password: { type: "string", example: "P@ssw0rd123" },
                },
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "a@example.com" },
                    password: { type: "string", example: "P@ssw0rd123" },
                },
            },
            CreateAdminRequest: {
                type: "object",
                required: ["name", "email"],
                properties: {
                    name: { type: "string", example: "Admin A" },
                    email: {
                        type: "string",
                        format: "email",
                        example: "admin@example.com",
                    },
                },
            },
            VerifyAdminRequest: {
                type: "object",
                required: ["email", "token", "password"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "admin@example.com",
                    },
                    token: { type: "string" },
                    password: { type: "string", example: "P@ssw0rd123" },
                },
            },
            AdminLoginRequest: {
                type: "object",
                required: ["email", "password", "token"],
                properties: {
                    email: {
                        type: "string",
                        format: "email",
                        example: "admin@example.com",
                    },
                    password: { type: "string", example: "P@ssw0rd123" },
                    token: { type: "string" },
                },
            },
            BanUserRequest: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: { type: "string" },
                },
            },
            SecondFactorAuthRequest: {
                type: "object",
                required: ["userId", "otp"],
                properties: {
                    userId: { type: "string" },
                    otp: { type: "string", example: "123456" },
                },
            },
            RefreshTokenRequest: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string" },
                },
            },
            SendResetPasswordEmailRequest: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email", example: "a@example.com" },
                },
            },
            VerifyResetPasswordRequest: {
                type: "object",
                required: ["otp"],
                properties: {
                    otp: { type: "string", example: "123456" },
                },
            },
            ChangePasswordRequest: {
                type: "object",
                required: ["token", "newPassword", "oldPassword"],
                properties: {
                    token: { type: "string" },
                    newPassword: { type: "string", example: "P@ssw0rd123" },
                    oldPassword: { type: "string", example: "P@ssw0rd123" },
                },
            },
            UpdateProfileRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    walletId: { type: "string" },
                },
            },
            WalletAmountRequest: {
                type: "object",
                required: ["amount"],
                properties: {
                    amount: { type: "number", example: 100000 },
                },
            },
            CreateMomoPaymentRequest: {
                type: "object",
                properties: {
                    amount: { type: "number", example: 199000 },
                    orderInfo: { type: "string", example: "Order #123" },
                    redirectUrl: {
                        type: "string",
                        example: "https://example.com/return",
                    },
                    extraData: { type: "string" },
                    lang: { type: "string", enum: ["vi", "en"], example: "vi" },
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["productId", "quantity"],
                            properties: {
                                productId: { type: "string" },
                                quantity: { type: "integer", minimum: 1, example: 1 },
                            },
                        },
                    },
                },
            },
            AddActivityRequest: {
                type: "object",
                required: ["userId", "activity"],
                properties: {
                    userId: { type: "string" },
                    activity: {
                        type: "string",
                        enum: ["view", "search", "click", "buy"],
                        example: "view",
                    },
                    keyword: { type: "string" },
                    productId: { type: "string" },
                },
            },
            CheckActionPermissionRequest: {
                type: "object",
                required: ["userId", "action"],
                properties: {
                    userId: { type: "string", example: "user_123" },
                    action: { type: "string", example: "admin:users.read" },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Gateway health check",
                responses: { "200": { description: "OK" } },
            },
        },
        "/admin/health": {
            get: {
                tags: ["Health"],
                summary: "Admin health page (monitor)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/register": {
            post: {
                tags: ["Users"],
                summary: "Register (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/login": {
            post: {
                tags: ["Users"],
                summary: "Login (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/second-factor-auth": {
            post: {
                tags: ["Users"],
                summary: "2FA verify OTP (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SecondFactorAuthRequest" },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/refresh-token": {
            post: {
                tags: ["Users"],
                summary: "Refresh token (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/verify-email": {
            get: {
                tags: ["Users"],
                summary: "Verify email (proxied)",
                parameters: [
                    {
                        name: "token",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/send-reset-password-email": {
            post: {
                tags: ["Users"],
                summary: "Send reset password email (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/SendResetPasswordEmailRequest",
                            },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/verify-resetpassword": {
            post: {
                tags: ["Users"],
                summary: "Verify reset password OTP (proxied)",
                parameters: [
                    {
                        name: "token",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/VerifyResetPasswordRequest",
                            },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/change-password": {
            post: {
                tags: ["Users"],
                summary: "Change password (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
                        },
                    },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/users/logout": {
            post: {
                tags: ["Users"],
                summary: "Logout (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/users/profile": {
            get: {
                tags: ["Users"],
                summary: "Get current profile (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
            put: {
                tags: ["Users"],
                summary: "Update current profile (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Delete current account (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/users/profile/{id}": {
            get: {
                tags: ["Users"],
                summary: "Get user profile by id (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/products/search": {
            get: {
                tags: ["Products"],
                summary: "Search products (proxied)",
                parameters: [
                    {
                        name: "q",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                    {
                        name: "limit",
                        in: "query",
                        required: false,
                        schema: { type: "integer" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/top/purchases": {
            get: {
                tags: ["Products"],
                summary: "Top purchases (proxied)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/top/sale": {
            get: {
                tags: ["Products"],
                summary: "Top sale (proxied)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/top/point": {
            get: {
                tags: ["Products"],
                summary: "Top point (proxied)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/top/list-type": {
            get: {
                tags: ["Products"],
                summary: "Top list type (proxied)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/top/type/{type}": {
            get: {
                tags: ["Products"],
                summary: "Top by type (proxied)",
                parameters: [
                    {
                        name: "type",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/products/recommend": {
            post: {
                tags: ["Products"],
                summary: "Recommend (proxied)",
                requestBody: {
                    required: false,
                    content: { "application/json": { schema: { type: "object" } } },
                },
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/admin/login": {
            post: {
                tags: ["Admin"],
                summary: "Admin login (proxied)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminLoginRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/admin/create": {
            post: {
                tags: ["Admin"],
                summary: "Create admin invite (requires admin Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateAdminRequest" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/admin/verify": {
            post: {
                tags: ["Admin"],
                summary: "Verify admin (proxied)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/VerifyAdminRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/admin/ban-user": {
            post: {
                tags: ["Admin"],
                summary: "Ban user (requires admin Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/BanUserRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden" },
                },
            },
        },
        "/api/products/recommend/{userId}": {
            post: {
                tags: ["Products"],
                summary: "Recommend by user (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/products": {
            post: {
                tags: ["Products"],
                summary: "Create product (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["name", "description", "price", "type", "image"],
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    price: { type: "number", minimum: 0 },
                                    type: { type: "string" },
                                    image: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/products/{productId}": {
            get: {
                tags: ["Products"],
                summary: "Get product by id (proxied)",
                parameters: [
                    {
                        name: "productId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/payments/momo/create": {
            post: {
                tags: ["Payments"],
                summary: "Create MoMo payment (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateMomoPaymentRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/payments/momo/ipn": {
            post: {
                tags: ["Payments"],
                summary: "MoMo IPN (proxied)",
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/payments/wallet/checkout": {
            post: {
                tags: ["Payments"],
                summary: "Checkout using wallet (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateMomoPaymentRequest" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/payments/{orderId}": {
            get: {
                tags: ["Payments"],
                summary: "Get payment status (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "orderId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/wallets": {
            post: {
                tags: ["Payments"],
                summary: "Create wallet (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/WalletAmountRequest" },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created" },
                    "401": { description: "Unauthorized" },
                },
            },
            get: {
                tags: ["Payments"],
                summary: "Get wallet details (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/wallets/credit": {
            post: {
                tags: ["Payments"],
                summary: "Credit wallet (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/WalletAmountRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/activities": {
            post: {
                tags: ["Activities"],
                summary: "Add activity (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AddActivityRequest" },
                        },
                    },
                },
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/activities/flush/{userId}": {
            post: {
                tags: ["Activities"],
                summary: "Flush activities (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/activities/queue/{userId}": {
            get: {
                tags: ["Activities"],
                summary: "Queue status (proxied)",
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
            delete: {
                tags: ["Activities"],
                summary: "Clear queue (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/activities/history/{userId}": {
            get: {
                tags: ["Activities"],
                summary: "History (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": { description: "OK" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/activities/recent/{userId}": {
            get: {
                tags: ["Activities"],
                summary: "Recent activities (proxied)",
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: { "200": { description: "OK" } },
            },
        },
        "/api/permissions/check": {
            post: {
                tags: ["Permissions"],
                summary: "Check action permission (requires Bearer token)",
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CheckActionPermissionRequest",
                            },
                        },
                    },
                },
                responses: {
                    "200": { description: "Permission granted" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden" },
                },
            },
        },
    },
};
