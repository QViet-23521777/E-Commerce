import mongoose from "mongoose";
import { redisService } from "../services/redis.service";
import { kafkaConsumerService } from "../services/kafkaConsumer.service";

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) return false;

    const db = mongoose.connection.db;
    if (!db) return false;

    await db.admin().ping();
    return true;
  } catch {
    return false;
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redisService.ping();
    return result === "PONG";
  } catch {
    return false;
  }
};

export const checkKafkaHealth = async (): Promise<boolean> => {
  try {
    const result = await kafkaConsumerService.ping();
    return result === "PONG";
  } catch {
    return false;
  }
};
