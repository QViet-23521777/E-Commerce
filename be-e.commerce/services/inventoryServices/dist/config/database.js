"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_model_1 = require("../models/product.model");
const index_1 = require("./index");
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(index_1.config.mongoUri);
        const db = mongoose_1.default.connection.db;
        if (!db)
            throw new Error("DB not connected");
        const rawCount = await db.collection("product").countDocuments();
        const modelCollection = product_model_1.Product.collection.name;
        const modelCount = await product_model_1.Product.estimatedDocumentCount();
        console.log("[mongo] connected");
        console.log("[mongo] uri:", index_1.config.mongoUri);
        console.log("[mongo] db:", db.databaseName);
        console.log("[mongo] host:", mongoose_1.default.connection.host);
        console.log("[mongo] raw product count:", rawCount);
        console.log("[mongo] mongoose collection:", modelCollection);
        console.log("[mongo] mongoose product count:", modelCount);
        const sample = await db
            .collection("product")
            .find({}, { projection: { name: 1, price: 1, sale: 1, type: 1 } })
            .limit(3)
            .toArray();
        console.log("[mongo] sample:", sample);
        if (rawCount === 0) {
            console.warn("[mongo] product collection is empty. If you're running via Docker, don't use 'localhost' inside the app container. Use mongodb://mongo:27017/ecommerce_inventory (mongo service) or mongodb://host.docker.internal:27017/ecommerce_inventory (host Mongo).");
        }
    }
    catch (error) {
        console.error("[mongo] connection error:", error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
mongoose_1.default.connection.on("disconnected", () => {
    console.log("[mongo] disconnected");
});
mongoose_1.default.connection.on("error", (err) => {
    console.error("[mongo] error:", err);
});
mongoose_1.default.connection.on("connected", () => {
    console.log("[mongo] connected to:", mongoose_1.default.connection.host, mongoose_1.default.connection.db?.databaseName);
});
//# sourceMappingURL=database.js.map