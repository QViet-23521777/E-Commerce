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

  async startActivityCosumer(
    handler: (data: {
      userId: string;
      activity: string;
      productId?: string;
      inventoryId?: string;
    }) => Promise<void>,
  ): Promise<void> {
    const topic = process.env.KAFKA_ACTIVITY_TOPIC || "payment.activity";
    const consumer = this.kafka.consumer({
      groupId: "activity-service-consumer",
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const data = JSON.parse(message.value.toString());
          await handler(data);
        } catch (err) {
          console.error("[KafkaConsumer] Failed to process message:", err);
        }
      },
    });

    console.log(`✅ Kafka consumer started, topic: ${topic}`);
  }
}

export const kafkaService = new KafkaService();
