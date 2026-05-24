export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Inventory Service API",
    version: "1.0.0",
    description: "OpenAPI documentation for Inventory Service.",
  },
  servers: [{ url: "/" }],
  tags: [{ name: "Health" }, { name: "Products" }, { name: "Inventory" }],
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "string" } },
        },
      },
      CreateInventoryRequest: {
        type: "object",
        required: ["name", "productId", "quantity"],
        properties: {
          name: { type: "string", example: "Kho HCM - SP A" },
          productId: { type: "string", example: "6639f3e0c1d2a3b4c5d6e7f8" },
          quantity: { type: "integer", example: 10, minimum: 1 },
        },
      },
      UpdateInventoryQuantityRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", example: 10, minimum: 1 },
        },
      },
      BuyProductRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", example: 1, minimum: 1 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/products": {
      post: {
        tags: ["Products"],
        summary: "Create product (multipart/form-data)",
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
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/products/search": {
      get: {
        tags: ["Products"],
        summary: "Search products",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" }, "400": { description: "Bad request" } },
      },
    },
    "/api/products/top/purchases": {
      get: { tags: ["Products"], summary: "Top purchases", responses: { "200": { description: "OK" } } },
    },
    "/api/products/top/sale": {
      get: { tags: ["Products"], summary: "Top sale", responses: { "200": { description: "OK" } } },
    },
    "/api/products/top/point": {
      get: { tags: ["Products"], summary: "Top point", responses: { "200": { description: "OK" } } },
    },
    "/api/products/top/list-type": {
      get: { tags: ["Products"], summary: "Top list type", responses: { "200": { description: "OK" } } },
    },
    "/api/products/top/type/{type}": {
      get: {
        tags: ["Products"],
        summary: "Top by type",
        parameters: [{ name: "type", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/products/recommend": {
      post: { tags: ["Products"], summary: "Recommend (tracking without data)", responses: { "200": { description: "OK" } } },
    },
    "/api/products/recommend/{userId}": {
      post: {
        tags: ["Products"],
        summary: "Recommend (tracking by user)",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/products/{productId}": {
      get: {
        tags: ["Products"],
        summary: "Get product by id",
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
    "/api/inventory": {
      post: {
        tags: ["Inventory"],
        summary: "Create inventory",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInventoryRequest" },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Bad request" } },
      },
    },
    "/api/inventory/search": {
      get: {
        tags: ["Inventory"],
        summary: "Search inventories by name",
        parameters: [{ name: "name", in: "query", required: false, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/inventory/seller/{sellerId}": {
      get: {
        tags: ["Inventory"],
        summary: "Get inventory by seller id",
        parameters: [{ name: "sellerId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/inventory/{inventoryId}": {
      get: {
        tags: ["Inventory"],
        summary: "Get inventory by id",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      delete: {
        tags: ["Inventory"],
        summary: "Delete inventory",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/inventory/{inventoryId}/quantity": {
      put: {
        tags: ["Inventory"],
        summary: "Update inventory quantity",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateInventoryQuantityRequest" },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Bad request" } },
      },
    },
    "/api/inventory/{inventoryId}/buy": {
      post: {
        tags: ["Inventory"],
        summary: "Buy product from inventory",
        parameters: [{ name: "inventoryId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BuyProductRequest" },
            },
          },
        },
        responses: { "200": { description: "OK" }, "400": { description: "Bad request" } },
      },
    },
  },
} as const;

