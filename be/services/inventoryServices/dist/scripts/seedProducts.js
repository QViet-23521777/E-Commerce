"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = require("../models/product.model");
const config_1 = require("../config");
const parseArgs = () => {
    const args = process.argv.slice(2);
    const fileFlagIndex = args.findIndex((a) => a === "--file" || a === "-f");
    const file = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : args[0] ?? "";
    const drop = args.includes("--drop");
    if (!file) {
        console.error("Usage: ts-node src/scripts/seedProducts.ts --file <products_mongo.json> [--drop]");
        process.exit(1);
    }
    return { file, drop };
};
const toDate = (value) => {
    if (!value)
        return undefined;
    const dt = new Date(String(value));
    return Number.isNaN(dt.getTime()) ? undefined : dt;
};
const main = async () => {
    const { file, drop } = parseArgs();
    const fullPath = node_path_1.default.resolve(process.cwd(), file);
    if (!node_fs_1.default.existsSync(fullPath)) {
        console.error("[seed] file not found:", fullPath);
        process.exit(1);
    }
    const raw = node_fs_1.default.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
        console.error("[seed] JSON must be an array");
        process.exit(1);
    }
    await mongoose_1.default.connect(config_1.config.mongoUri);
    const db = mongoose_1.default.connection.db;
    if (!db)
        throw new Error("DB not connected");
    console.log("[seed] uri:", config_1.config.mongoUri);
    console.log("[seed] db:", db.databaseName);
    console.log("[seed] collection:", product_model_1.Product.collection.name);
    const before = await product_model_1.Product.estimatedDocumentCount();
    console.log("[seed] before count:", before);
    if (drop) {
        await product_model_1.Product.deleteMany({});
        console.log("[seed] dropped existing documents");
    }
    const docs = data
        .filter((p) => p && typeof p === "object")
        .map((p) => ({
        ...p,
        createdAt: toDate(p.createdAt) ?? new Date(),
        updatedAt: toDate(p.updatedAt) ?? new Date(),
    }));
    const result = await product_model_1.Product.insertMany(docs, { ordered: false });
    console.log("[seed] inserted:", result.length);
    const after = await product_model_1.Product.estimatedDocumentCount();
    console.log("[seed] after count:", after);
    await mongoose_1.default.disconnect();
};
main().catch(async (err) => {
    console.error("[seed] error:", err);
    try {
        await mongoose_1.default.disconnect();
    }
    catch {
        // ignore
    }
    process.exit(1);
});
//# sourceMappingURL=seedProducts.js.map