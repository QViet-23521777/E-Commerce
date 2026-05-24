"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const openapi_1 = require("../openapi");
(0, node_test_1.default)("openapi includes permissions check endpoint", () => {
    strict_1.default.ok(openapi_1.openapiSpec.tags?.some((t) => t.name === "Permissions"));
    const paths = openapi_1.openapiSpec.paths;
    strict_1.default.ok(paths["/api/permissions/check"]?.post);
});
