import type { OpenAPIObject } from "openapi3-ts/oas30";

export const openapiSpec: OpenAPIObject = {
  openapi: "3.0.3",
  info: {
    title: "User Service API",
    version: "1.0.0",
    description: "Interactive API documentation for User Service.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Health" },
    { name: "Users" },
    { name: "Admin" },
    { name: "SuperAdmin" },
    { name: "Sellers" },
    { name: "ActionPermissions" },
  ],
  components: {
    securitySchemes: {
      InternalSecret: {
        type: "apiKey",
        in: "header",
        name: "x-internal-secret",
        description: "Internal gateway/service secret required for /api/users/*",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "string" } },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 6, example: "Nguyen Van A" },
          email: { type: "string", format: "email", example: "a@example.com" },
          password: { type: "string", minLength: 8, example: "P@ssw0rd123" },
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
      GenericSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
      },
      CreateAdminRequest: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string", example: "Admin A" },
          email: { type: "string", format: "email", example: "admin@example.com" },
        },
      },
      VerifyAdminRequest: {
        type: "object",
        required: ["email", "token", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          token: { type: "string" },
          password: { type: "string", example: "P@ssw0rd123" },
        },
      },
      BanUserRequest: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string" },
        },
      },
      CreateSellerRequest: {
        type: "object",
        required: ["userId", "address", "phone"],
        properties: {
          userId: { type: "string" },
          address: { type: "string" },
          phone: { type: "string" },
        },
      },
      VerifySellerRequest: {
        type: "object",
        required: ["userId", "otp"],
        properties: {
          userId: { type: "string" },
          otp: { type: "string" },
        },
      },
      CheckActionPermissionRequest: {
        type: "object",
        required: ["userId", "action"],
        properties: {
          userId: { type: "string" },
          action: { type: "string" },
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
          newPassword: { type: "string", minLength: 8, example: "P@ssw0rd123" },
          oldPassword: { type: "string", minLength: 8, example: "P@ssw0rd123" },
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
      AdminLoginRequest: {
        type: "object",
        required: ["email", "password", "token"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", example: "P@ssw0rd123" },
          token: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: { type: "string", example: "User Service" },
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/register": {
      post: {
        tags: ["Users"],
        summary: "Register",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden (missing/invalid x-internal-secret)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Users"],
        summary: "Login",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Forbidden (missing/invalid x-internal-secret)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/users/refresh-token": {
      post: {
        tags: ["Users"],
        summary: "Refresh token",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/verify-email": {
      get: {
        tags: ["Users"],
        summary: "Verify email",
        security: [{ InternalSecret: [] }],
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/send-reset-password-email": {
      post: {
        tags: ["Users"],
        summary: "Send reset password email",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendResetPasswordEmailRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/verify-resetpassword": {
      post: {
        tags: ["Users"],
        summary: "Verify reset password",
        security: [{ InternalSecret: [] }],
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
              schema: { $ref: "#/components/schemas/VerifyResetPasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/change-password": {
      post: {
        tags: ["Users"],
        summary: "Change password",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/second-factor-auth": {
      post: {
        tags: ["Users"],
        summary: "Second factor auth",
        security: [{ InternalSecret: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SecondFactorAuthRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/logout": {
      post: {
        tags: ["Users"],
        summary: "Logout",
        security: [{ InternalSecret: [] }],
        parameters: [
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-email", in: "header", required: false, schema: { type: "string" } },
          { name: "x-user-role", in: "header", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Get current profile",
        security: [{ InternalSecret: [] }],
        parameters: [
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-email", in: "header", required: false, schema: { type: "string" } },
          { name: "x-user-role", in: "header", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update current profile",
        security: [{ InternalSecret: [] }],
        parameters: [
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-email", in: "header", required: false, schema: { type: "string" } },
          { name: "x-user-role", in: "header", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete current account",
        security: [{ InternalSecret: [] }],
        parameters: [
          { name: "x-user-id", in: "header", required: true, schema: { type: "string" } },
          { name: "x-user-email", in: "header", required: false, schema: { type: "string" } },
          { name: "x-user-role", in: "header", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/profile/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get profile by id",
        security: [{ InternalSecret: [] }],
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
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/create": {
      post: {
        tags: ["Admin"],
        summary: "Create admin invite",
        description:
          "Restricted by IP allow-list (ADMIN_ALLOWED_IPS). Requires x-user-id header to identify the super admin.",
        parameters: [
          {
            name: "x-user-id",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Super admin user id (forwarded from gateway)",
          },
          {
            name: "x-user-email",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "x-user-role",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
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
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/admin/verify": {
      post: {
        tags: ["Admin"],
        summary: "Verify admin (set password)",
        description: "Restricted by IP allow-list (ADMIN_ALLOWED_IPS).",
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
          "403": { description: "Forbidden" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login",
        description: "Restricted by IP allow-list (ADMIN_ALLOWED_IPS).",
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
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/admin/ban-user": {
      post: {
        tags: ["Admin"],
        summary: "Ban user",
        description:
          "Restricted by IP allow-list (ADMIN_ALLOWED_IPS). Requires x-user-id header to identify the admin.",
        parameters: [
          {
            name: "x-user-id",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Admin user id (forwarded from gateway)",
          },
        ],
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
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/superadmin/login": {
      post: {
        tags: ["SuperAdmin"],
        summary: "Superadmin login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/superadmin/create-admin": {
      post: {
        tags: ["SuperAdmin"],
        summary: "Create admin invite (superadmin)",
        description:
          "Requires x-user-id and x-user-role=superadmin headers (forwarded from gateway).",
        parameters: [
          {
            name: "x-user-id",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Superadmin user id (forwarded from gateway)",
          },
          {
            name: "x-user-role",
            in: "header",
            required: true,
            schema: { type: "string", example: "superadmin" },
            description: "Caller role (forwarded from gateway)",
          },
        ],
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
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/sellers/create": {
      post: {
        tags: ["Sellers"],
        summary: "Create seller account (send OTP)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSellerRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/sellers/verify": {
      post: {
        tags: ["Sellers"],
        summary: "Verify seller account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifySellerRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "400": { description: "Bad request" },
        },
      },
    },
    "/api/sellers/{userId}": {
      get: {
        tags: ["Sellers"],
        summary: "Get seller profile",
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Sellers"],
        summary: "Update seller profile",
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Sellers"],
        summary: "Delete seller account",
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/permissions/check": {
      post: {
        tags: ["ActionPermissions"],
        summary: "Check action permission",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CheckActionPermissionRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Permission granted" },
          "403": { description: "Permission denied / Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};

