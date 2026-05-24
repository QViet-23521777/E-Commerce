import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGODB_URI ||
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
