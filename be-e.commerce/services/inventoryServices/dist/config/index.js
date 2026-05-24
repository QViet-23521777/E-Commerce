"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3003,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/ecommerce_inventory",
    internalSecret: process.env.INTERNAL_SECRET || "",
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
        apiKey: process.env.CLOUDINARY_API_KEY || "",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    },
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    kafkaBroker: process.env.KAFKA_BROKER || "localhost:9092",
    kafkaTopic: process.env.KAFKA_TOPIC || "user-events",
};
//# sourceMappingURL=index.js.map