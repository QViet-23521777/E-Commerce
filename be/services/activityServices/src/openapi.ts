export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Activity Service API",
    version: "1.0.0",
    description: "OpenAPI documentation for Activity Service.",
  },
  servers: [{ url: "/" }],
  tags: [{ name: "Health" }, { name: "Activities" }],
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
      AddActivityRequest: {
        type: "object",
        required: ["userId", "activity"],
        properties: {
          userId: { type: "string", example: "6639f3e0c1d2a3b4c5d6e7f8" },
          activity: {
            type: "string",
            enum: ["view", "search", "click", "buy"],
            example: "view",
          },
          keyword: { type: "string", example: "iphone 15" },
          productId: { type: "string", example: "6639f3e0c1d2a3b4c5d6e7f8" },
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
    "/api/activities": {
      post: {
        tags: ["Activities"],
        summary: "Add activity event",
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
    "/api/activities/flush/{userId}": {
      post: {
        tags: ["Activities"],
        summary: "Flush activity queue for user",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/activities/queue/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Get queue status for user",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["Activities"],
        summary: "Clear queue for user",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/activities/history/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Get activity history for user",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/activities/recent/{userId}": {
      get: {
        tags: ["Activities"],
        summary: "Get recent activities for user",
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
} as const;

