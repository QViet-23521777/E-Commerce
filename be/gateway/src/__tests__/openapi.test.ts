import test from "node:test";
import assert from "node:assert/strict";

import { openapiSpec } from "../openapi";

test("openapi includes core and missing system endpoints", () => {
  assert.ok(openapiSpec.tags?.some((t) => t.name === "Permissions"));
  assert.ok(openapiSpec.tags?.some((t) => t.name === "Inventory"));
  assert.ok(openapiSpec.tags?.some((t) => t.name === "Redis"));
  assert.ok(openapiSpec.tags?.some((t) => t.name === "Sellers"));

  const paths = (openapiSpec as any).paths as Record<string, any>;
  assert.ok(paths["/api/permissions/check"]?.post);
  assert.ok(paths["/api/inventory"]?.post);
  assert.ok(paths["/api/redis/recommendations/{userId}"]?.get);
  assert.ok(paths["/api/sellers/create"]?.post);
});
