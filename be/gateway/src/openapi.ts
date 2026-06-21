// ─── Reusable building blocks ────────────────────────────────────────────────

const OID = { type: "string", example: "6639f3e0c1d2a3b4c5d6e7f8" } as const;
const DATE = { type: "string", format: "date-time", example: "2025-06-12T08:00:00.000Z" } as const;
const OK200 = { description: "Success" } as const;
const ERR401 = { description: "Unauthorized – missing or invalid Bearer token" } as const;
const ERR403 = { description: "Forbidden – insufficient permissions" } as const;
const ERR404 = { description: "Not found" } as const;
const ERR400 = { description: "Bad request / validation error" } as const;
const BEARER = [{ BearerAuth: [] }] as const;
const pathParam = (name: string, desc?: string) => ({
  name,
  in: "path" as const,
  required: true,
  schema: { type: "string" },
  ...(desc ? { description: desc } : {}),
});

// ─── Main spec ───────────────────────────────────────────────────────────────

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "MiniSupermarket API Gateway",
    version: "2.0.0",
    description:
      "Tài liệu API đầy đủ cho hệ thống MiniSupermarket (microservices). " +
      "Tất cả requests đi qua Gateway tại cổng 3000. " +
      "Xác thực bằng JWT Bearer token (trừ các endpoint công khai). " +
      "Admin endpoints yêu cầu role admin và chỉ chấp nhận từ IP whitelist.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local Gateway" }],

  tags: [
    { name: "Health",      description: "Kiểm tra trạng thái hệ thống" },
    { name: "Users",       description: "Đăng ký, đăng nhập, hồ sơ người dùng" },
    { name: "Admin",       description: "Quản trị hệ thống (yêu cầu role admin + IP whitelist)" },
    { name: "Sellers",     description: "Tài khoản người bán" },
    { name: "Products",    description: "Sản phẩm và gợi ý" },
    { name: "Inventory",   description: "Kho hàng" },
    { name: "Payments",    description: "Đơn hàng và thanh toán" },
    { name: "Wallets",     description: "Ví điện tử" },
    { name: "Activities",  description: "Lịch sử hoạt động người dùng" },
    { name: "Chat",        description: "Tin nhắn giữa buyer và shop" },
    { name: "Promotions",  description: "Mã khuyến mãi" },
    { name: "Permissions", description: "Kiểm tra quyền hành động" },
    { name: "Redis",       description: "Cache gợi ý sản phẩm (internal)" },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token nhận được sau khi đăng nhập",
      },
    },

    schemas: {
      // ── Common ─────────────────────────────────────────────────────────────
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors:  { type: "array", items: { type: "string" }, example: ["email is required"] },
        },
      },

      // ── Users ──────────────────────────────────────────────────────────────
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name:     { type: "string", minLength: 6, example: "Nguyen Van A" },
          email:    { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 8, example: "P@ssw0rd!" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", example: "P@ssw0rd!" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserProfile" },
              accessToken:  { type: "string", description: "JWT access token" },
              refreshToken: { type: "string", description: "JWT refresh token" },
              requires2FA:  { type: "boolean", example: false, description: "Nếu true, cần gọi /second-factor-auth" },
              userId:       { ...OID, description: "Chỉ có khi requires2FA = true" },
            },
          },
        },
      },
      SecondFactorAuthRequest: {
        type: "object",
        required: ["userId", "otp"],
        properties: {
          userId: OID,
          otp:    { type: "string", minLength: 6, maxLength: 6, example: "123456" },
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
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      VerifyResetPasswordRequest: {
        type: "object",
        required: ["otp"],
        properties: {
          otp: { type: "string", minLength: 6, maxLength: 6, example: "654321" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        description: "Có 2 flow: (1) reset-token flow: cần token + newPassword; (2) JWT flow: cần oldPassword + newPassword",
        required: ["newPassword"],
        properties: {
          token:       { type: "string", description: "Token từ email reset (flow 1)" },
          oldPassword: { type: "string", example: "OldP@ss1",  description: "Mật khẩu cũ (flow 2 – khi đã đăng nhập)" },
          newPassword: { type: "string", minLength: 8, example: "NewP@ss1!" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name:             { type: "string", minLength: 6, example: "Nguyen Van B" },
          walletId:         { type: "string", example: "wallet_abc123" },
          twoFactorEnabled: { type: "boolean", example: true },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          _id:              OID,
          name:             { type: "string", example: "nguyen van a" },
          email:            { type: "string", format: "email", example: "user@example.com" },
          walletId:         { type: "string", nullable: true },
          isActive:         { type: "boolean", example: true },
          isVerified:       { type: "boolean", example: true },
          twoFactorEnabled: { type: "boolean", example: true },
          avatar:           { type: "string", nullable: true },
          phone:            { type: "string", nullable: true, example: "0909123456" },
          address:          { type: "string", nullable: true },
          preferences:      { type: "array", items: { type: "string" } },
          searchHistory:    { type: "array", items: { type: "string" } },
          createdAt:        DATE,
          updatedAt:        DATE,
        },
      },

      // ── Admin ──────────────────────────────────────────────────────────────
      CreateAdminRequest: {
        type: "object",
        required: ["name", "email", "superAdminId"],
        properties: {
          name:        { type: "string", minLength: 6, example: "Admin Viet" },
          email:       { type: "string", format: "email", example: "admin@supermarket.vn" },
          superAdminId: OID,
        },
      },
      VerifyAdminRequest: {
        type: "object",
        required: ["email", "token", "password"],
        properties: {
          email:    { type: "string", format: "email", example: "admin@supermarket.vn" },
          token:    { type: "string", description: "Token từ email mời" },
          password: { type: "string", minLength: 8, example: "Admin@123" },
        },
      },
      AdminLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string", format: "email", example: "admin@supermarket.vn" },
          password: { type: "string", example: "Admin@123" },
        },
      },
      BanUserRequest: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: OID,
        },
      },
      SetProductStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
            example: "approved",
          },
          reason: {
            type: "string",
            description: "Lý do từ chối (bắt buộc khi status = rejected)",
            example: "Hình ảnh không đạt yêu cầu",
          },
        },
      },

      // ── Sellers ────────────────────────────────────────────────────────────
      CreateSellerRequest: {
        type: "object",
        required: ["userId", "address", "phone"],
        properties: {
          userId:  OID,
          address: { type: "string", example: "123 Nguyễn Huệ, Q1, TP.HCM" },
          phone:   { type: "string", example: "0909123456" },
        },
      },
      VerifySellerRequest: {
        type: "object",
        required: ["userId", "otp"],
        properties: {
          userId: OID,
          otp:    { type: "string", minLength: 6, maxLength: 6, example: "123456" },
        },
      },
      UpdateSellerRequest: {
        type: "object",
        properties: {
          address: { type: "string", example: "456 Lê Lợi, Q1, TP.HCM" },
          phone:   { type: "string", example: "0901234567" },
          name:    { type: "string" },
        },
      },

      // ── Products ───────────────────────────────────────────────────────────
      ProductSchema: {
        type: "object",
        properties: {
          _id:             OID,
          name:            { type: "string", example: "iPhone 15 Pro 256GB" },
          description:     { type: "string", example: "Điện thoại Apple iPhone 15 Pro" },
          price:           { type: "number", example: 28990000 },
          sale:            { type: "number", example: 5, description: "Phần trăm giảm giá (0–100)" },
          imageUrl:        { type: "array", items: { type: "string" }, example: ["https://cdn.example.com/iphone15.jpg"] },
          thumbnail:       { type: "string", example: "https://cdn.example.com/iphone15.jpg" },
          type:            { type: "string", example: "electronics" },
          point:           { type: "number", example: 100, description: "Điểm tích lũy khi mua" },
          numPurchases:    { type: "number", example: 520 },
          status:          { type: "string", enum: ["pending", "approved", "rejected"], example: "approved" },
          rejectionReason: { type: "string", nullable: true },
          rating:          { type: "number", minimum: 0, maximum: 5, example: 4.5 },
          numReviews:      { type: "number", example: 38 },
          createdAt:       DATE,
          updatedAt:       DATE,
        },
      },
      CreateProductRequest: {
        type: "object",
        description: "Multipart form-data. Dùng file upload (image) HOẶC imageUrl, không cần cả hai.",
        required: ["name", "description", "price", "type"],
        properties: {
          name:        { type: "string", example: "iPhone 15 Pro 256GB" },
          description: { type: "string", example: "Điện thoại Apple mới nhất 2024" },
          price:       { type: "number", minimum: 0, example: 28990000 },
          type:        { type: "string", example: "electronics" },
          sale:        { type: "number", minimum: 0, maximum: 100, example: 5 },
          point:       { type: "number", minimum: 0, example: 100 },
          imageUrl:    { type: "string", format: "uri", example: "https://cdn.example.com/product.jpg" },
          thumbnail:   { type: "string", format: "uri", example: "https://cdn.example.com/product-thumb.jpg" },
          image:       { type: "string", format: "binary", description: "File ảnh (thay thế imageUrl)" },
        },
      },
      RecommendRequest: {
        type: "object",
        description: "Mảng events hành vi người dùng để cập nhật và lấy gợi ý.",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              required: ["activity"],
              properties: {
                activity:   { type: "string", enum: ["view", "search", "click", "buy"], example: "view" },
                productId:  { ...OID, description: "Bắt buộc với view/click/buy" },
                keyword:    { type: "string", example: "iphone 15", description: "Bắt buộc với search" },
                categoryId: { type: "string", example: "electronics" },
              },
            },
          },
        },
      },

      // ── Inventory ──────────────────────────────────────────────────────────
      InventorySchema: {
        type: "object",
        properties: {
          _id:       OID,
          name:      { type: "string", example: "Kho HCM – iPhone 15 Pro" },
          sellerId:  OID,
          productId: OID,
          quantity:  { type: "integer", example: 50 },
          createdAt: DATE,
          updatedAt: DATE,
        },
      },
      CreateInventoryRequest: {
        type: "object",
        required: ["name", "productId", "quantity", "sellerId"],
        properties: {
          name:      { type: "string", example: "Kho HCM – iPhone 15 Pro" },
          productId: OID,
          quantity:  { type: "integer", minimum: 1, example: 50 },
          sellerId:  OID,
        },
      },
      UpdateInventoryQuantityRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 0, example: 75 },
        },
      },
      BuyProductRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1, example: 2 },
        },
      },
      BatchInventoryItem: {
        type: "object",
        required: ["inventoryId", "quantity"],
        properties: {
          inventoryId: OID,
          quantity:    { type: "integer", minimum: 1, example: 1 },
        },
      },
      BatchBuyRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/BatchInventoryItem" },
          },
        },
      },
      CheckInventoryRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/BatchInventoryItem" },
          },
        },
      },

      // ── Payments ───────────────────────────────────────────────────────────
      OrderItem: {
        type: "object",
        properties: {
          productId:        OID,
          catalogProductId: OID,
          name:      { type: "string", example: "iPhone 15 Pro 256GB" },
          image:     { type: "string", example: "https://cdn.example.com/iphone15.jpg" },
          quantity:  { type: "integer", example: 1 },
          unitPrice: { type: "number", example: 28990000 },
          totalPrice:{ type: "number", example: 28990000 },
          sellerId:  OID,
        },
      },
      PaymentSchema: {
        type: "object",
        properties: {
          _id:               OID,
          userId:            OID,
          orderId:           { type: "string", example: "ORDER_1718167200000_abc123" },
          amount:            { type: "number", example: 28990000 },
          currency:          { type: "string", example: "VND" },
          orderInfo:         { type: "string", example: "Thanh toán đơn hàng #123" },
          status:            { type: "string", enum: ["pending", "paid", "failed"], example: "paid" },
          fulfillmentStatus: {
            type: "string",
            enum: ["to_confirm", "processing", "shipped", "delivered", "cancelled"],
            example: "to_confirm",
          },
          items:       { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          trackingNo:  { type: "string", nullable: true, example: "VN123456789" },
          payUrl:      { type: "string", nullable: true, description: "URL chuyển hướng đến MoMo" },
          paidAt:      { ...DATE, nullable: true },
          cancelledAt: { ...DATE, nullable: true },
          createdAt:   DATE,
          updatedAt:   DATE,
        },
      },
      CreateMomoPaymentRequest: {
        type: "object",
        description: "Cung cấp `items` (danh sách sản phẩm) HOẶC `amount` trực tiếp.",
        properties: {
          amount:      { type: "number", minimum: 1, example: 28990000, description: "Tổng tiền (tuỳ chọn nếu có items)" },
          orderInfo:   { type: "string", example: "Thanh toán đơn hàng tại MiniSupermarket" },
          redirectUrl: { type: "string", format: "uri", example: "https://app.example.com/payment/return" },
          extraData:   { type: "string", example: "" },
          lang:        { type: "string", enum: ["vi", "en"], example: "vi" },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: OID,
                quantity:  { type: "integer", minimum: 1, example: 1 },
              },
            },
          },
        },
      },
      WalletCheckoutRequest: {
        type: "object",
        description: "Cung cấp `items` (danh sách sản phẩm) HOẶC `amount` trực tiếp.",
        properties: {
          amount:    { type: "number", minimum: 1, example: 28990000 },
          orderInfo: { type: "string", example: "Mua hàng tại MiniSupermarket" },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: OID,
                quantity:  { type: "integer", minimum: 1, example: 1 },
              },
            },
          },
        },
      },
      FulfillmentActionRequest: {
        type: "object",
        required: ["action"],
        description: "Luồng: to_confirm → (confirm) → processing → (ship) → shipped → (deliver) → delivered",
        properties: {
          action: {
            type: "string",
            enum: ["confirm", "ship", "deliver"],
            example: "confirm",
          },
          trackingNo: { type: "string", example: "VN123456789", description: "Bắt buộc khi action = ship" },
        },
      },

      // ── Wallets ────────────────────────────────────────────────────────────
      WalletSchema: {
        type: "object",
        properties: {
          _id:       OID,
          userId:    OID,
          balance:   { type: "number", minimum: 0, example: 500000 },
          createdAt: DATE,
          updatedAt: DATE,
        },
      },
      WalletCreditRequest: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: { type: "number", minimum: 1, example: 200000 },
        },
      },

      // ── Activities ─────────────────────────────────────────────────────────
      AddActivityRequest: {
        type: "object",
        required: ["userId", "activity"],
        properties: {
          userId:     OID,
          activity:   { type: "string", enum: ["view", "search", "click", "buy"], example: "view" },
          keyword:    { type: "string", example: "iphone 15", description: "Bắt buộc khi activity = search" },
          productId:  { ...OID, description: "Bắt buộc khi activity = view/click/buy" },
          categoryId: { type: "string", example: "electronics" },
          metadata: {
            type: "object",
            additionalProperties: true,
            example: { source: "homepage", campaign: "summer-sale" },
          },
        },
      },

      // ── Chat ───────────────────────────────────────────────────────────────
      SendMessageRequest: {
        type: "object",
        required: ["text"],
        description: "Cung cấp `conversationId` (reply) HOẶC `shopId` (tạo cuộc trò chuyện mới).",
        properties: {
          conversationId: { ...OID, description: "ID cuộc trò chuyện cũ (khi reply)" },
          shopId:         { ...OID, description: "ID shop (khi tạo cuộc trò chuyện mới)" },
          shopName:       { type: "string", example: "Shop Điện Tử ABC" },
          shopAvatar:     { type: "string", format: "uri", example: "https://cdn.example.com/shop.jpg" },
          buyerName:      { type: "string", example: "Nguyễn Văn A" },
          text:           { type: "string", example: "Sản phẩm còn hàng không?" },
          productRef: {
            type: "object",
            nullable: true,
            description: "Sản phẩm đính kèm trong tin nhắn",
            properties: {
              productId: OID,
              name:  { type: "string", example: "iPhone 15 Pro" },
              image: { type: "string", example: "https://cdn.example.com/iphone15.jpg" },
              price: { type: "number", example: 28990000 },
            },
          },
        },
      },
      MessageView: {
        type: "object",
        properties: {
          _id:        OID,
          senderRole: { type: "string", enum: ["buyer", "shop"] },
          senderId:   OID,
          text:       { type: "string", example: "Sản phẩm còn hàng không?" },
          productRef: {
            type: "object",
            nullable: true,
            properties: {
              productId: OID,
              name:  { type: "string" },
              image: { type: "string", nullable: true },
              price: { type: "number", nullable: true },
            },
          },
          createdAt: DATE,
        },
      },
      ConversationView: {
        type: "object",
        properties: {
          id:             OID,
          otherId:        OID,
          otherName:      { type: "string", example: "Shop Điện Tử ABC" },
          otherAvatar:    { type: "string", nullable: true },
          lastMessage:    { type: "string", example: "Còn hàng bạn nhé!" },
          lastSenderRole: { type: "string", enum: ["buyer", "shop"] },
          lastMessageAt:  DATE,
          unread:         { type: "integer", example: 2 },
          perspective:    { type: "string", enum: ["buyer", "shop"] },
        },
      },

      // ── Promotions ─────────────────────────────────────────────────────────
      PromotionSchema: {
        type: "object",
        properties: {
          _id:                OID,
          code:               { type: "string", example: "SUMMER2025" },
          title:              { type: "string", example: "Giảm 20% mùa hè" },
          description:        { type: "string", example: "Áp dụng cho tất cả sản phẩm điện tử" },
          discountType:       { type: "string", enum: ["percentage", "fixed"], example: "percentage" },
          discountValue:      { type: "number", example: 20 },
          minOrderAmount:     { type: "number", example: 100000 },
          maxDiscountAmount:  { type: "number", nullable: true, example: 50000 },
          startDate:          DATE,
          endDate:            DATE,
          active:             { type: "boolean", example: true },
          usageLimit:         { type: "integer", nullable: true, example: 100 },
          usedCount:          { type: "integer", example: 42 },
          usageLimitPerUser:  { type: "integer", nullable: true, example: 1 },
          productIds:         { type: "array", items: { type: "string" }, description: "Rỗng = áp dụng tất cả" },
          createdAt:          DATE,
          updatedAt:          DATE,
        },
      },
      CreatePromotionRequest: {
        type: "object",
        required: ["code", "title", "discountType", "discountValue", "startDate", "endDate"],
        properties: {
          code:              { type: "string", example: "SUMMER2025", description: "Tự động chuyển thành chữ hoa" },
          title:             { type: "string", example: "Giảm 20% mùa hè" },
          description:       { type: "string", example: "Áp dụng cho tất cả sản phẩm điện tử" },
          discountType:      { type: "string", enum: ["percentage", "fixed"], example: "percentage" },
          discountValue:     { type: "number", minimum: 0, example: 20, description: "Nếu percentage thì max 100" },
          minOrderAmount:    { type: "number", minimum: 0, example: 100000 },
          maxDiscountAmount: { type: "number", minimum: 1, nullable: true, example: 50000 },
          startDate:         { type: "string", format: "date-time", example: "2025-06-01T00:00:00Z" },
          endDate:           { type: "string", format: "date-time", example: "2025-08-31T23:59:59Z" },
          usageLimit:        { type: "integer", minimum: 1, nullable: true, example: 100 },
          usageLimitPerUser: { type: "integer", minimum: 1, nullable: true, example: 1 },
          productIds: {
            type: "array",
            items: { type: "string" },
            example: [],
            description: "Mảng rỗng = áp dụng tất cả sản phẩm",
          },
        },
      },
      UpdatePromotionRequest: {
        type: "object",
        description: "Tất cả field đều tuỳ chọn – chỉ cập nhật field được gửi.",
        properties: {
          code:              { type: "string" },
          title:             { type: "string" },
          description:       { type: "string" },
          discountType:      { type: "string", enum: ["percentage", "fixed"] },
          discountValue:     { type: "number", minimum: 0 },
          minOrderAmount:    { type: "number", minimum: 0 },
          maxDiscountAmount: { type: "number", minimum: 1, nullable: true },
          startDate:         { type: "string", format: "date-time" },
          endDate:           { type: "string", format: "date-time" },
          usageLimit:        { type: "integer", minimum: 1, nullable: true },
          usageLimitPerUser: { type: "integer", minimum: 1, nullable: true },
          productIds:        { type: "array", items: { type: "string" } },
          active:            { type: "boolean" },
        },
      },
      ValidateOrRedeemPromotionRequest: {
        type: "object",
        required: ["code", "items"],
        properties: {
          code: { type: "string", example: "SUMMER2025" },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity", "unitPrice"],
              properties: {
                productId:  OID,
                quantity:   { type: "integer", minimum: 1, example: 2 },
                unitPrice:  { type: "number", minimum: 0, example: 28990000 },
              },
            },
          },
        },
      },

      // ── Permissions ────────────────────────────────────────────────────────
      CheckActionPermissionRequest: {
        type: "object",
        required: ["userId", "action"],
        properties: {
          userId: OID,
          action: { type: "string", example: "admin:users.read" },
        },
      },
    },
  },

  // ── Paths ─────────────────────────────────────────────────────────────────
  paths: {

    // ╔══════════════════╗
    // ║     HEALTH       ║
    // ╚══════════════════╝
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Gateway health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/admin/health": {
      get: {
        tags: ["Health"],
        summary: "Admin health monitor page",
        responses: { "200": OK200 },
      },
    },

    // ╔══════════════════╗
    // ║      USERS       ║
    // ╚══════════════════╝
    "/api/users/register": {
      post: {
        tags: ["Users"],
        summary: "Đăng ký tài khoản mới",
        description: "Tạo tài khoản và gửi email xác thực. Tên tối thiểu 6 ký tự, mật khẩu tối thiểu 8 ký tự.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Đăng ký thành công – vui lòng kiểm tra email để xác thực",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Registration successful. Please check your email." },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error (tên quá ngắn, email sai định dạng, v.v.)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Email đã được sử dụng" },
        },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Users"],
        summary: "Đăng nhập",
        description: "Trả về accessToken và refreshToken. Nếu `requires2FA = true`, dùng `userId` để gọi `/second-factor-auth`.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Đăng nhập thành công",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "400": ERR400,
          "401": { description: "Sai email hoặc mật khẩu" },
        },
      },
    },
    "/api/users/second-factor-auth": {
      post: {
        tags: ["Users"],
        summary: "Xác thực 2FA – bước 2 sau khi đăng nhập",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/SecondFactorAuthRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Xác thực thành công – trả về tokens",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "400": { description: "OTP không hợp lệ hoặc đã hết hạn" },
        },
      },
    },
    "/api/users/refresh-token": {
      post: {
        tags: ["Users"],
        summary: "Làm mới access token",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Trả về accessToken mới",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success:     { type: "boolean", example: true },
                    accessToken: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { description: "Refresh token không hợp lệ hoặc hết hạn" },
        },
      },
    },
    "/api/users/verify-email": {
      get: {
        tags: ["Users"],
        summary: "Xác thực email qua link",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Token trong link email xác thực",
          },
        ],
        responses: {
          "200": { description: "Email đã được xác thực thành công" },
          "400": { description: "Token không hợp lệ hoặc hết hạn" },
        },
      },
    },
    "/api/users/send-reset-password-email": {
      post: {
        tags: ["Users"],
        summary: "Gửi email đặt lại mật khẩu",
        description: "Gửi OTP 6 số và token đặt lại mật khẩu qua email. Có hiệu lực trong 1 giờ.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/SendResetPasswordEmailRequest" } },
          },
        },
        responses: {
          "200": { description: "Email đã được gửi" },
          "404": { description: "Email không tồn tại trong hệ thống" },
        },
      },
    },
    "/api/users/verify-resetpassword": {
      post: {
        tags: ["Users"],
        summary: "Xác thực OTP đặt lại mật khẩu",
        description: "Gửi OTP nhận từ email. Cần thêm query `?token=<token>` từ URL email.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Token từ URL trong email đặt lại mật khẩu",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/VerifyResetPasswordRequest" } },
          },
        },
        responses: {
          "200": { description: "OTP hợp lệ – có thể đặt mật khẩu mới" },
          "400": { description: "OTP không đúng hoặc token không hợp lệ" },
        },
      },
    },
    "/api/users/change-password": {
      post: {
        tags: ["Users"],
        summary: "Đổi mật khẩu",
        description: "**Flow 1 (reset):** Gửi `token` + `newPassword` (sau khi verify OTP). **Flow 2 (đã đăng nhập):** Gửi Bearer token + `oldPassword` + `newPassword`.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } },
          },
        },
        responses: {
          "200": { description: "Đổi mật khẩu thành công" },
          "400": { description: "Mật khẩu cũ sai hoặc token không hợp lệ" },
          "401": ERR401,
        },
      },
    },
    "/api/users/logout": {
      post: {
        tags: ["Users"],
        summary: "Đăng xuất",
        security: BEARER,
        responses: {
          "200": { description: "Đăng xuất thành công" },
          "401": ERR401,
        },
      },
    },
    "/api/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Lấy thông tin hồ sơ hiện tại",
        security: BEARER,
        responses: {
          "200": {
            description: "Thông tin hồ sơ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/UserProfile" },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
      put: {
        tags: ["Users"],
        summary: "Cập nhật hồ sơ hiện tại",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } },
          },
        },
        responses: {
          "200": { description: "Cập nhật thành công" },
          "401": ERR401,
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Xoá tài khoản hiện tại",
        security: BEARER,
        responses: {
          "200": { description: "Tài khoản đã bị xoá (soft delete)" },
          "401": ERR401,
        },
      },
    },
    "/api/users/profile/{id}": {
      get: {
        tags: ["Users"],
        summary: "Lấy hồ sơ người dùng theo ID",
        security: BEARER,
        parameters: [pathParam("id", "User ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Thông tin hồ sơ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/UserProfile" },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║      ADMIN       ║
    // ╚══════════════════╝
    "/api/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Đăng nhập admin",
        description: "Chỉ chấp nhận từ IP whitelist. Nếu `requires2FA = true`, gọi `/api/admin/second-factor-auth`.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AdminLoginRequest" } },
          },
        },
        responses: {
          "200": { description: "Đăng nhập thành công" },
          "401": { description: "Sai email/mật khẩu" },
          "403": { description: "IP không được phép" },
        },
      },
    },
    "/api/admin/second-factor-auth": {
      post: {
        tags: ["Admin"],
        summary: "Xác thực 2FA admin",
        description: "Chỉ chấp nhận từ IP whitelist.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/SecondFactorAuthRequest" } },
          },
        },
        responses: {
          "200": { description: "Xác thực thành công – trả về tokens" },
          "400": { description: "OTP không hợp lệ" },
          "403": { description: "IP không được phép" },
        },
      },
    },
    "/api/admin/create": {
      post: {
        tags: ["Admin"],
        summary: "Tạo tài khoản admin mới",
        description: "Gửi email mời xác thực đến địa chỉ admin mới. Cần `superAdminId`.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateAdminRequest" } },
          },
        },
        responses: {
          "201": { description: "Tạo thành công – email mời đã được gửi" },
          "400": ERR400,
        },
      },
    },
    "/api/admin/verify": {
      post: {
        tags: ["Admin"],
        summary: "Xác thực và kích hoạt tài khoản admin",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/VerifyAdminRequest" } },
          },
        },
        responses: {
          "200": { description: "Tài khoản admin đã được kích hoạt" },
          "400": { description: "Token không hợp lệ hoặc hết hạn" },
        },
      },
    },
    "/api/admin/ban-user": {
      post: {
        tags: ["Admin"],
        summary: "Cấm người dùng",
        description: "Yêu cầu role admin + IP whitelist.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BanUserRequest" } },
          },
        },
        responses: {
          "200": { description: "Người dùng đã bị cấm" },
          "401": ERR401,
          "403": ERR403,
        },
      },
    },
    "/api/admin/products/moderation": {
      get: {
        tags: ["Admin"],
        summary: "Danh sách sản phẩm cần duyệt",
        description: "Yêu cầu role admin + IP whitelist.",
        security: BEARER,
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["pending", "approved", "rejected"], default: "pending" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 50, maximum: 200 },
          },
        ],
        responses: {
          "200": {
            description: "Danh sách sản phẩm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "403": ERR403,
        },
      },
    },
    "/api/admin/products/{productId}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Cập nhật trạng thái duyệt sản phẩm",
        description: "Yêu cầu role admin + IP whitelist. Khi từ chối cần điền `reason`.",
        security: BEARER,
        parameters: [pathParam("productId", "Product ID (MongoDB ObjectId)")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/SetProductStatusRequest" } },
          },
        },
        responses: {
          "200": { description: "Cập nhật thành công" },
          "400": ERR400,
          "401": ERR401,
          "403": ERR403,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║     SELLERS      ║
    // ╚══════════════════╝
    "/api/sellers/create": {
      post: {
        tags: ["Sellers"],
        summary: "Tạo tài khoản người bán",
        description: "Gửi OTP xác thực qua email (hiệu lực 15 phút). Sau đó gọi `/api/sellers/verify`.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateSellerRequest" } },
          },
        },
        responses: {
          "200": { description: "OTP đã gửi qua email" },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/sellers/verify": {
      post: {
        tags: ["Sellers"],
        summary: "Xác thực OTP để kích hoạt tài khoản người bán",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/VerifySellerRequest" } },
          },
        },
        responses: {
          "200": { description: "Tài khoản người bán đã được kích hoạt" },
          "400": { description: "OTP không đúng hoặc hết hạn" },
          "401": ERR401,
        },
      },
    },
    "/api/sellers/{userId}/public": {
      get: {
        tags: ["Sellers"],
        summary: "Xem hồ sơ công khai của người bán (không cần đăng nhập)",
        parameters: [pathParam("userId", "User ID của người bán")],
        responses: {
          "200": { description: "Thông tin công khai người bán" },
          "404": ERR404,
        },
      },
    },
    "/api/sellers/{userId}": {
      get: {
        tags: ["Sellers"],
        summary: "Lấy hồ sơ người bán (đã đăng nhập)",
        security: BEARER,
        parameters: [pathParam("userId", "User ID của người bán")],
        responses: {
          "200": { description: "Thông tin chi tiết người bán" },
          "401": ERR401,
          "404": ERR404,
        },
      },
      put: {
        tags: ["Sellers"],
        summary: "Cập nhật hồ sơ người bán",
        security: BEARER,
        parameters: [pathParam("userId", "User ID của người bán")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateSellerRequest" } },
          },
        },
        responses: {
          "200": { description: "Cập nhật thành công" },
          "401": ERR401,
          "404": ERR404,
        },
      },
      delete: {
        tags: ["Sellers"],
        summary: "Xoá tài khoản người bán",
        security: BEARER,
        parameters: [pathParam("userId", "User ID của người bán")],
        responses: {
          "200": { description: "Đã xoá" },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║     PRODUCTS     ║
    // ╚══════════════════╝
    "/api/products/search": {
      get: {
        tags: ["Products"],
        summary: "Tìm kiếm sản phẩm",
        description: "Full-text search theo tên. Trả về các sản phẩm đã được duyệt (status = approved).",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 2 },
            example: "iphone",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Kết quả tìm kiếm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                  },
                },
              },
            },
          },
          "400": { description: "Query `q` bắt buộc và tối thiểu 2 ký tự" },
        },
      },
    },
    "/api/products/top/purchases": {
      get: {
        tags: ["Products"],
        summary: "Top sản phẩm được mua nhiều nhất",
        description: "Cursor-based pagination. Lần đầu không cần cursor. Lần tiếp theo dùng `lastId` + `lastnumPurchases` từ item cuối.",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "lastnumPurchases", in: "query", schema: { type: "integer" }, description: "Cursor – numPurchases của item cuối" },
          { name: "lastId", in: "query", schema: { type: "string" }, description: "Cursor – _id của item cuối" },
        ],
        responses: {
          "200": {
            description: "Danh sách sản phẩm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/top/sale": {
      get: {
        tags: ["Products"],
        summary: "Top sản phẩm giảm giá cao nhất",
        parameters: [
          { name: "limit",    in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "lastSale", in: "query", schema: { type: "number" }, description: "Cursor – sale của item cuối" },
          { name: "lastId",   in: "query", schema: { type: "string" }, description: "Cursor – _id của item cuối" },
        ],
        responses: { "200": { description: "Danh sách sản phẩm", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } } } } } } } },
      },
    },
    "/api/products/top/point": {
      get: {
        tags: ["Products"],
        summary: "Top sản phẩm điểm tích lũy cao nhất",
        parameters: [
          { name: "limit",     in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "lastPoint", in: "query", schema: { type: "number" }, description: "Cursor – point của item cuối" },
          { name: "lastId",    in: "query", schema: { type: "string" }, description: "Cursor – _id của item cuối" },
        ],
        responses: { "200": { description: "Danh sách sản phẩm", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } } } } } } } },
      },
    },
    "/api/products/top/list-type": {
      get: {
        tags: ["Products"],
        summary: "Top sản phẩm theo nhiều loại (type) cùng lúc",
        description: "Trả về map `{ [type]: ProductSchema[] }`. Mỗi type lấy `limit` sản phẩm.",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 5, maximum: 20 } },
          {
            name: "type",
            in: "query",
            required: true,
            schema: { type: "string" },
            example: "electronics,fashion,food",
            description: "Danh sách type, phân cách bằng dấu phẩy",
          },
        ],
        responses: {
          "200": {
            description: "Map type → danh sách sản phẩm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      additionalProperties: { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                      example: { electronics: [], fashion: [] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/top/type/{type}": {
      get: {
        tags: ["Products"],
        summary: "Top sản phẩm theo một loại (type)",
        parameters: [
          pathParam("type", "Loại sản phẩm, ví dụ: electronics"),
          { name: "limit",  in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "lastId", in: "query", schema: { type: "string" }, description: "Cursor – _id của item cuối" },
        ],
        responses: { "200": { description: "Danh sách sản phẩm" } },
      },
    },
    "/api/products/recommend": {
      post: {
        tags: ["Products"],
        summary: "Lấy gợi ý sản phẩm (không cần đăng nhập, không lưu tracking)",
        requestBody: {
          required: false,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecommendRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Danh sách sản phẩm gợi ý",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/products/recommend/{userId}": {
      post: {
        tags: ["Products"],
        summary: "Ghi lại hành vi và lấy gợi ý cá nhân hoá",
        description: "Lưu events vào lịch sử người dùng để cải thiện gợi ý.",
        security: BEARER,
        parameters: [pathParam("userId", "User ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecommendRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Danh sách sản phẩm gợi ý dựa trên hành vi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/ProductSchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/products": {
      post: {
        tags: ["Products"],
        summary: "Tạo sản phẩm mới",
        description: "Dùng `multipart/form-data`. Upload file ảnh qua `image` HOẶC cung cấp `imageUrl`.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": { schema: { $ref: "#/components/schemas/CreateProductRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Sản phẩm đã được tạo, chờ duyệt (status = pending)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/ProductSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/products/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Lấy chi tiết sản phẩm theo ID",
        parameters: [pathParam("productId", "Product ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Chi tiết sản phẩm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/ProductSchema" },
                  },
                },
              },
            },
          },
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║    INVENTORY     ║
    // ╚══════════════════╝
    "/api/inventory": {
      post: {
        tags: ["Inventory"],
        summary: "Tạo kho hàng mới",
        description: "Liên kết một sản phẩm với người bán và số lượng tồn kho.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateInventoryRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Kho hàng đã được tạo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/InventorySchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/inventory/search": {
      get: {
        tags: ["Inventory"],
        summary: "Tìm kho hàng theo tên",
        parameters: [
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "Kho HCM",
          },
        ],
        responses: {
          "200": {
            description: "Danh sách kho hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/InventorySchema" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/inventory/seller/{sellerId}": {
      get: {
        tags: ["Inventory"],
        summary: "Lấy tất cả kho hàng của một người bán",
        security: BEARER,
        parameters: [pathParam("sellerId", "Seller ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Danh sách kho hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/InventorySchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/inventory/product/{productId}": {
      get: {
        tags: ["Inventory"],
        summary: "Lấy tất cả shop đang bán một sản phẩm",
        description: "Trả về danh sách các inventory records của sản phẩm này từ nhiều shop.",
        parameters: [pathParam("productId", "Product ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Danh sách kho hàng của sản phẩm",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/InventorySchema" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/inventory/{inventoryId}": {
      get: {
        tags: ["Inventory"],
        summary: "Lấy thông tin kho hàng theo ID",
        security: BEARER,
        parameters: [pathParam("inventoryId", "Inventory ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Thông tin kho hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/InventorySchema" },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "404": ERR404,
        },
      },
      delete: {
        tags: ["Inventory"],
        summary: "Xoá kho hàng",
        security: BEARER,
        parameters: [pathParam("inventoryId", "Inventory ID (MongoDB ObjectId)")],
        responses: {
          "200": { description: "Đã xoá" },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },
    "/api/inventory/{inventoryId}/quantity": {
      put: {
        tags: ["Inventory"],
        summary: "Cập nhật số lượng tồn kho",
        security: BEARER,
        parameters: [pathParam("inventoryId", "Inventory ID (MongoDB ObjectId)")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateInventoryQuantityRequest" } },
          },
        },
        responses: {
          "200": { description: "Cập nhật thành công" },
          "400": ERR400,
          "401": ERR401,
          "404": ERR404,
        },
      },
    },
    "/api/inventory/{inventoryId}/buy": {
      post: {
        tags: ["Inventory"],
        summary: "Mua sản phẩm từ kho (giảm tồn kho)",
        security: BEARER,
        parameters: [pathParam("inventoryId", "Inventory ID (MongoDB ObjectId)")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BuyProductRequest" } },
          },
        },
        responses: {
          "200": { description: "Mua thành công – tồn kho đã được trừ" },
          "400": { description: "Số lượng không đủ" },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },
    "/api/inventory/{inventoryId}/restore": {
      post: {
        tags: ["Inventory"],
        summary: "Hoàn trả số lượng kho (dùng khi huỷ đơn hàng) – Internal",
        description: "Chỉ được gọi từ các service nội bộ.",
        parameters: [pathParam("inventoryId", "Inventory ID (MongoDB ObjectId)")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BuyProductRequest" } },
          },
        },
        responses: {
          "200": { description: "Đã hoàn trả" },
          "404": ERR404,
        },
      },
    },
    "/api/inventory/buy/batch": {
      post: {
        tags: ["Inventory"],
        summary: "Mua nhiều sản phẩm cùng lúc – Internal",
        description: "Được payment service gọi khi tạo đơn hàng.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BatchBuyRequest" } },
          },
        },
        responses: {
          "200": { description: "Mua thành công" },
          "400": { description: "Một hoặc nhiều sản phẩm không đủ tồn kho" },
        },
      },
    },
    "/api/inventory/check": {
      post: {
        tags: ["Inventory"],
        summary: "Kiểm tra khả năng cung ứng – Internal",
        description: "Kiểm tra xem danh sách sản phẩm có đủ tồn kho không (không giảm kho).",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CheckInventoryRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Kết quả kiểm tra",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success:   { type: "boolean", example: true },
                    available: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/inventory/restore/batch": {
      post: {
        tags: ["Inventory"],
        summary: "Hoàn trả nhiều sản phẩm cùng lúc – Internal",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BatchBuyRequest" } },
          },
        },
        responses: { "200": { description: "Đã hoàn trả" } },
      },
    },

    // ╔══════════════════╗
    // ║     PAYMENTS     ║
    // ╚══════════════════╝
    "/api/payments": {
      get: {
        tags: ["Payments"],
        summary: "Lấy danh sách đơn hàng của tôi",
        security: BEARER,
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "paid", "failed"],
            },
            description: "Lọc theo trạng thái thanh toán",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Danh sách đơn hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/PaymentSchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/payments/seller": {
      get: {
        tags: ["Payments"],
        summary: "Lấy danh sách đơn hàng của shop tôi",
        security: BEARER,
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "paid", "failed"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Danh sách đơn hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/PaymentSchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/payments/momo/create": {
      post: {
        tags: ["Payments"],
        summary: "Tạo phiên thanh toán MoMo",
        description: "Trả về `payUrl` để redirect người dùng sang trang thanh toán MoMo.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateMomoPaymentRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Phiên thanh toán được tạo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        payUrl:    { type: "string", format: "uri", description: "URL redirect sang MoMo" },
                        deeplink:  { type: "string", nullable: true },
                        qrCodeUrl: { type: "string", nullable: true },
                        orderId:   { type: "string", example: "ORDER_1718167200000_abc123" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/payments/momo/ipn": {
      post: {
        tags: ["Payments"],
        summary: "MoMo IPN callback – Internal",
        description: "Endpoint nhận thông báo từ MoMo sau khi thanh toán. Chỉ MoMo gọi endpoint này.",
        responses: {
          "204": { description: "Nhận thành công" },
          "400": ERR400,
        },
      },
    },
    "/api/payments/wallet/checkout": {
      post: {
        tags: ["Payments"],
        summary: "Thanh toán bằng ví điện tử",
        description: "Trừ tiền từ ví và tạo đơn hàng. Trả về 402 nếu ví không đủ số dư.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/WalletCheckoutRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Thanh toán thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PaymentSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
          "402": { description: "Ví không đủ số dư" },
        },
      },
    },
    "/api/payments/{orderId}": {
      get: {
        tags: ["Payments"],
        summary: "Lấy trạng thái đơn hàng theo ID",
        security: BEARER,
        parameters: [pathParam("orderId", "Order ID (chuỗi định danh đơn hàng)")],
        responses: {
          "200": {
            description: "Thông tin đơn hàng",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PaymentSchema" },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },
    "/api/payments/{orderId}/fulfillment": {
      patch: {
        tags: ["Payments"],
        summary: "Cập nhật trạng thái giao hàng",
        description:
          "Luồng giao hàng: `to_confirm` → **confirm** → `processing` → **ship** → `shipped` → **deliver** → `delivered`. " +
          "Khi `action = ship`, bắt buộc cung cấp `trackingNo`.",
        security: BEARER,
        parameters: [pathParam("orderId", "Order ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/FulfillmentActionRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Cập nhật thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PaymentSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
          "404": ERR404,
        },
      },
    },
    "/api/payments/{orderId}/cancel": {
      post: {
        tags: ["Payments"],
        summary: "Huỷ đơn hàng",
        description: "Chỉ có thể huỷ khi fulfillmentStatus = `to_confirm` hoặc `processing`.",
        security: BEARER,
        parameters: [pathParam("orderId", "Order ID")],
        responses: {
          "200": {
            description: "Đơn hàng đã bị huỷ",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PaymentSchema" },
                  },
                },
              },
            },
          },
          "400": { description: "Không thể huỷ ở trạng thái này" },
          "401": ERR401,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║      WALLETS     ║
    // ╚══════════════════╝
    "/api/wallets": {
      get: {
        tags: ["Wallets"],
        summary: "Lấy thông tin ví của tôi (tự động tạo nếu chưa có)",
        security: BEARER,
        responses: {
          "200": {
            description: "Thông tin ví",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/WalletSchema" },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
      post: {
        tags: ["Wallets"],
        summary: "Lấy hoặc tạo ví (tương đương GET)",
        description: "Không cần body. Tự động upsert ví nếu chưa tồn tại.",
        security: BEARER,
        responses: {
          "200": {
            description: "Thông tin ví",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/WalletSchema" },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/wallets/credit": {
      post: {
        tags: ["Wallets"],
        summary: "Nạp tiền vào ví",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/WalletCreditRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Nạp tiền thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/WalletSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },

    // ╔══════════════════╗
    // ║    ACTIVITIES    ║
    // ╚══════════════════╝
    "/api/activities": {
      post: {
        tags: ["Activities"],
        summary: "Ghi lại sự kiện hành vi người dùng",
        description: "Được lưu vào Redis queue và flush định kỳ vào MongoDB.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AddActivityRequest" } },
          },
        },
        responses: {
          "200": { description: "Đã ghi nhận" },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/activities/flush/{userId}": {
      post: {
        tags: ["Activities"],
        summary: "Flush queue activity ra MongoDB ngay lập tức",
        security: BEARER,
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": { description: "Flush thành công" },
          "401": ERR401,
        },
      },
    },
    "/api/activities/queue/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Lấy trạng thái queue (số lượng events chưa flush)",
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": {
            description: "Trạng thái queue",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        userId: OID,
                        count:  { type: "integer", example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Activities"],
        summary: "Xoá toàn bộ queue của người dùng",
        security: BEARER,
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": { description: "Queue đã được xoá" },
          "401": ERR401,
        },
      },
    },
    "/api/activities/history/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Lịch sử hoạt động của người dùng (từ MongoDB)",
        security: BEARER,
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": {
            description: "Danh sách hoạt động",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          activity:  { type: "string", enum: ["view", "search", "click", "buy"] },
                          productId: { type: "string", nullable: true },
                          keyword:   { type: "string", nullable: true },
                          createdAt: DATE,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/activities/recent/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Hoạt động gần đây của người dùng (từ Redis queue)",
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": {
            description: "Danh sách hoạt động gần đây",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          activity:  { type: "string", enum: ["view", "search", "click", "buy"] },
                          productId: { type: "string", nullable: true },
                          keyword:   { type: "string", nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ╔══════════════════╗
    // ║       CHAT       ║
    // ╚══════════════════╝
    "/api/chat/conversations": {
      get: {
        tags: ["Chat"],
        summary: "Danh sách cuộc trò chuyện của tôi",
        description: "Cursor-based pagination. Dùng `before` (ISO datetime) của item cuối để load thêm.",
        security: BEARER,
        parameters: [
          {
            name: "before",
            in: "query",
            required: false,
            schema: { type: "string", format: "date-time" },
            description: "Cursor – lastMessageAt của item cuối cùng đã load",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Danh sách cuộc trò chuyện",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success:    { type: "boolean", example: true },
                    data:       { type: "array", items: { $ref: "#/components/schemas/ConversationView" } },
                    hasMore:    { type: "boolean", example: false },
                    nextCursor: { type: "string", format: "date-time", nullable: true },
                  },
                },
              },
            },
          },
          "401": ERR401,
        },
      },
    },
    "/api/chat/messages": {
      post: {
        tags: ["Chat"],
        summary: "Gửi tin nhắn",
        description:
          "Nếu `conversationId` được cung cấp: reply vào cuộc trò chuyện cũ. " +
          "Nếu không: tạo cuộc trò chuyện mới – cần cung cấp `shopId`, `shopName`, `buyerName`.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/SendMessageRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Tin nhắn đã gửi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        conversationId: OID,
                        message: { $ref: "#/components/schemas/MessageView" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
        },
      },
    },
    "/api/chat/conversations/{id}/messages": {
      get: {
        tags: ["Chat"],
        summary: "Lấy danh sách tin nhắn trong một cuộc trò chuyện",
        description:
          "Cursor-based pagination. Dùng `before` (message ID) để tải tin nhắn cũ hơn (scroll up). " +
          "Dùng `after` để poll tin nhắn mới hơn.",
        security: BEARER,
        parameters: [
          pathParam("id", "Conversation ID (MongoDB ObjectId)"),
          {
            name: "before",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Message ID – load tin nhắn cũ hơn (scroll up)",
          },
          {
            name: "after",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Message ID – poll tin nhắn mới hơn",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 40, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Danh sách tin nhắn",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success:    { type: "boolean", example: true },
                    data:       { type: "array", items: { $ref: "#/components/schemas/MessageView" } },
                    hasMore:    { type: "boolean", example: true },
                    nextCursor: { type: "string", nullable: true, description: "ID của tin nhắn cũ nhất để dùng làm `before` cursor" },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "403": { description: "Không có quyền truy cập cuộc trò chuyện này" },
          "404": ERR404,
        },
      },
    },
    "/api/chat/conversations/{id}/read": {
      post: {
        tags: ["Chat"],
        summary: "Đánh dấu cuộc trò chuyện đã đọc",
        security: BEARER,
        parameters: [pathParam("id", "Conversation ID (MongoDB ObjectId)")],
        responses: {
          "200": { description: "Đã đánh dấu đọc" },
          "401": ERR401,
          "403": ERR403,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║   PROMOTIONS     ║
    // ╚══════════════════╝
    "/api/promotions": {
      get: {
        tags: ["Promotions"],
        summary: "Danh sách tất cả mã khuyến mãi (yêu cầu admin)",
        security: BEARER,
        responses: {
          "200": {
            description: "Danh sách mã khuyến mãi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/PromotionSchema" } },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "403": ERR403,
        },
      },
      post: {
        tags: ["Promotions"],
        summary: "Tạo mã khuyến mãi mới (yêu cầu admin)",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreatePromotionRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Tạo thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PromotionSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
          "403": ERR403,
          "409": { description: "Code đã tồn tại" },
        },
      },
    },
    "/api/promotions/active": {
      get: {
        tags: ["Promotions"],
        summary: "Danh sách mã khuyến mãi đang hoạt động (public)",
        responses: {
          "200": {
            description: "Danh sách mã khuyến mãi active",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { type: "array", items: { $ref: "#/components/schemas/PromotionSchema" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/promotions/validate": {
      post: {
        tags: ["Promotions"],
        summary: "Kiểm tra mã khuyến mãi (không áp dụng, chỉ tính toán)",
        description: "Tính toán mức giảm giá nhưng không lưu vào DB. Dùng để preview trước khi thanh toán.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ValidateOrRedeemPromotionRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Kết quả tính toán giảm giá",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        discountAmount:   { type: "number", example: 50000 },
                        originalTotal:    { type: "number", example: 250000 },
                        finalTotal:       { type: "number", example: 200000 },
                        promotion:        { $ref: "#/components/schemas/PromotionSchema" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Mã không hợp lệ, hết hạn hoặc không đủ điều kiện" },
          "401": ERR401,
        },
      },
    },
    "/api/promotions/redeem": {
      post: {
        tags: ["Promotions"],
        summary: "Áp dụng mã khuyến mãi (lưu vào DB, trừ lượt dùng)",
        description: "Gọi endpoint này khi người dùng xác nhận thanh toán với mã giảm giá.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ValidateOrRedeemPromotionRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Áp dụng thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        discountAmount: { type: "number", example: 50000 },
                        originalTotal:  { type: "number", example: 250000 },
                        finalTotal:     { type: "number", example: 200000 },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Mã không hợp lệ, hết hạn, vượt giới hạn dùng, hoặc đơn không đủ điều kiện" },
          "401": ERR401,
        },
      },
    },
    "/api/promotions/code/{code}": {
      get: {
        tags: ["Promotions"],
        summary: "Lấy thông tin mã khuyến mãi theo code (public)",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "SUMMER2025",
          },
        ],
        responses: {
          "200": {
            description: "Thông tin mã khuyến mãi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PromotionSchema" },
                  },
                },
              },
            },
          },
          "404": ERR404,
        },
      },
    },
    "/api/promotions/{promotionId}": {
      get: {
        tags: ["Promotions"],
        summary: "Lấy chi tiết mã khuyến mãi theo ID (yêu cầu admin)",
        security: BEARER,
        parameters: [pathParam("promotionId", "Promotion ID (MongoDB ObjectId)")],
        responses: {
          "200": {
            description: "Chi tiết mã khuyến mãi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PromotionSchema" },
                  },
                },
              },
            },
          },
          "401": ERR401,
          "403": ERR403,
          "404": ERR404,
        },
      },
      patch: {
        tags: ["Promotions"],
        summary: "Cập nhật mã khuyến mãi (yêu cầu admin)",
        security: BEARER,
        parameters: [pathParam("promotionId", "Promotion ID (MongoDB ObjectId)")],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdatePromotionRequest" } },
          },
        },
        responses: {
          "200": {
            description: "Cập nhật thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data:    { $ref: "#/components/schemas/PromotionSchema" },
                  },
                },
              },
            },
          },
          "400": ERR400,
          "401": ERR401,
          "403": ERR403,
          "404": ERR404,
        },
      },
      delete: {
        tags: ["Promotions"],
        summary: "Xoá mã khuyến mãi (yêu cầu admin)",
        security: BEARER,
        parameters: [pathParam("promotionId", "Promotion ID (MongoDB ObjectId)")],
        responses: {
          "200": { description: "Đã xoá" },
          "401": ERR401,
          "403": ERR403,
          "404": ERR404,
        },
      },
    },

    // ╔══════════════════╗
    // ║   PERMISSIONS    ║
    // ╚══════════════════╝
    "/api/permissions/check": {
      post: {
        tags: ["Permissions"],
        summary: "Kiểm tra quyền thực hiện một hành động",
        description: "Trả về 200 nếu có quyền, 403 nếu không có quyền.",
        security: BEARER,
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CheckActionPermissionRequest" } },
          },
        },
        responses: {
          "200": { description: "Có quyền thực hiện hành động" },
          "401": ERR401,
          "403": { description: "Không có quyền" },
        },
      },
    },

    // ╔══════════════════╗
    // ║      REDIS       ║
    // ╚══════════════════╝
    "/api/redis/recommendations/{userId}": {
      get: {
        tags: ["Redis"],
        summary: "Lấy gợi ý sản phẩm từ Redis cache",
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": {
            description: "Dữ liệu gợi ý từ Redis",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        userId:     OID,
                        productIds: { type: "array", items: { type: "string" }, example: ["6639f3e0c1d2a3b4c5d6e7f8"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Redis"],
        summary: "Thêm sản phẩm vào danh sách gợi ý Redis",
        parameters: [pathParam("userId", "User ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: { productId: OID },
              },
            },
          },
        },
        responses: { "200": { description: "Đã thêm vào Redis" } },
      },
    },
    "/api/redis/recommendations-recent/{userId}": {
      get: {
        tags: ["Redis"],
        summary: "Lấy gợi ý sản phẩm gần đây từ Redis",
        parameters: [pathParam("userId", "User ID")],
        responses: {
          "200": {
            description: "Danh sách product ID gần đây",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success:    { type: "boolean", example: true },
                    productIds: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;