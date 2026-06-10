import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3004,

  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/activity",

  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  kafkaBroker: process.env.KAFKA_BROKER || "localhost:9092",
  kafkaTopic: process.env.KAFKA_TOPIC || "user-events",
};
