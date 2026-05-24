import { Kafka, Producer, logLevel } from "kafkajs";
import { config } from "../config";

interface ActivityPayload {
  userId: string;
  events: unknown[];
  totalEvents: number;
  timestamp: Date;
}

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "activity-service",
      brokers: [config.kafkaBroker],
      logLevel: logLevel.WARN,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.producer.connect();
    this.connected = true;
    console.log("✅ Kafka producer connected");
  }

  async publishActivity(activity: ActivityPayload): Promise<void> {
    if (!this.connected) await this.connect();
    await this.producer.send({
      topic: config.kafkaTopic,
      messages: [{ key: activity.userId, value: JSON.stringify(activity) }],
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.connected = false;
  }

  async ping(): Promise<string> {
    try {
      await this.producer.send({
        topic: config.kafkaTopic,
        messages: [{ key: "ping", value: "ping" }],
      });
      return "PONG";
    } catch (error) {
      console.error("Kafka ping error:", error);
      throw error;
    }
  }
}

export const kafkaService = new KafkaService();
