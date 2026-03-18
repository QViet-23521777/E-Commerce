import { Kafka, Producer, logLevel } from "kafkajs";
import { config } from "../config";

class KafkaService {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: "activity-service",
      brokers: [config.kafkaBroker],
      logLevel: logLevel.WARN,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log("✅ Kafka producer connected");
  }

  async publishActivity(activity: object): Promise<void> {
    await this.producer.send({
      topic: config.kafkaTopic,
      messages: [
        {
          key: (activity as any).userId,
          value: JSON.stringify(activity),
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}

export const kafkaService = new KafkaService();
