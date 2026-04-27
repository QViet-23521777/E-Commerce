import { Kafka, Consumer, logLevel } from "kafkajs";
import { config } from "../config";
import { redisService } from "./redis.service";

const ACTIVITY_WEIGHT = {
  view: 1,
  search: 2,
  click: 3,
  buy: 5,
};

class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private connected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "inventory-service",
      brokers: [config.kafkaBroker],
      logLevel: logLevel.WARN,
    });
    this.consumer = this.kafka.consumer({
      groupId: "inventory-group",
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.consumer.connect();
    this.connected = true;
    await this.consumer.subscribe({
      topic: config.kafkaTopic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const batch = JSON.parse(message.value?.toString() || "{}");
          const { userId, events, totalEvents } = batch;

          if (!userId || !events || !Array.isArray(events)) return;

          console.log(`📦 Nhận batch ${totalEvents} events từ user: ${userId}`);
        } catch (error) {
          console.error("❌ Kafka message error:", error);
        }
      },
    });

    console.log("✅ Kafka consumer connected");
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.consumer.disconnect();
    this.connected = false;
  }

  async ping(): Promise<string> {
    try {
      await this.consumer.subscribe({
        topic: config.kafkaTopic,
        fromBeginning: false,
      });
      return "PONG";
    } catch (error) {
      console.error("Kafka ping error:", error);
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
