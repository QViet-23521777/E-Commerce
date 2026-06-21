import { Kafka, Consumer, logLevel } from "kafkajs";
import { config } from "../config";
import { redisService } from "./redis.service";
import Inventory from "../models/inventory.model";
import { Product } from "../models/product.model";

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

          const productScores = new Map<string, number>();
          const activityTypes = new Set<string>();

          // Resolve inventoryId → productId cho các event chỉ có inventoryId
          const invIds = [
            ...new Set(
              events
                .filter((e) => e.inventoryId && !e.productId)
                .map((e) => e.inventoryId as string),
            ),
          ];
          const invToProductMap = new Map<string, string>();
          if (invIds.length > 0) {
            const inventories = await Inventory.find(
              { _id: { $in: invIds } },
              { productId: 1 },
            );
            for (const inv of inventories) {
              invToProductMap.set(inv._id.toString(), inv.productId.toString());
            }
          }

          for (const event of events) {
            const { activity, timestamp } = event;
            const productId = event.productId
              ?? (event.inventoryId ? invToProductMap.get(event.inventoryId) : undefined);
            if (activity) activityTypes.add(activity);
            if (!productId) continue;
            const weight =
              ACTIVITY_WEIGHT[activity as keyof typeof ACTIVITY_WEIGHT] ?? 1;
            const daysSince = timestamp
              ? (Date.now() - Number(timestamp)) / (1000 * 60 * 60 * 24)
              : 0;
            const decayFactor = Math.exp(-0.1 * daysSince);
            productScores.set(
              productId,
              (productScores.get(productId) ?? 0) + weight * decayFactor,
            );
          }

          if (productScores.size === 0) return;

          const sortedProducts = [...productScores.entries()].sort(
            (a, b) => b[1] - a[1],
          );

          for (const [productId] of sortedProducts) {
            await redisService.addRecommend(userId, productId);
          }

          await redisService.setRecommendationData(userId, {
            productIds: sortedProducts.map(([pid]) => pid),
            categories: [...activityTypes].filter(Boolean),
            updatedAt: new Date(),
          });

          console.log(
            `✅ Recommend cập nhật: ${sortedProducts.length} sản phẩm cho user ${userId}`,
          );
        } catch (error) {
          console.error("❌ Kafka message error:", error);
        }
      },
    });

    // ─── payment.completed → cập nhật numSales + numPurchases ───
    const salesConsumer = this.kafka.consumer({ groupId: "inventory-sales-group" });
    await salesConsumer.connect();
    await salesConsumer.subscribe({
      topic: process.env.KAFKA_PAYMENT_COMPLETED_TOPIC || "payment.completed",
      fromBeginning: false,
    });
    await salesConsumer.run({
      eachMessage: async ({ message }) => {
        try {
          const item = JSON.parse(message.value?.toString() || "{}") as {
            inventoryId: string;
            productId?: string | null;
            quantity: number;
          };
          if (!item.inventoryId || !item.quantity) return;

          await Inventory.findByIdAndUpdate(
            item.inventoryId,
            { $inc: { numSales: item.quantity } },
          );

          if (item.productId) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { numPurchases: item.quantity } },
            );
          }
        } catch (error) {
          console.error("❌ Sales event error:", error);
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
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return "PONG";
    } catch (error) {
      console.error("Kafka ping error:", error);
      throw error;
    }
  }
}

export const kafkaConsumerService = new KafkaConsumerService();
