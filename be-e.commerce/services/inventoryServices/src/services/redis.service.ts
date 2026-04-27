import Redis from "ioredis";
import { config } from "../config";

class RedisServices {
  private client: Redis;
  private eventQueue: Map<string, any[]> = new Map();

  constructor() {
    this.client = new Redis(config.redisUrl);
    this.client.on("connect", () =>
      console.log("✅ Redis recommend connected"),
    );
    this.client.on("error", (err) =>
      console.error("❌ Redis recommend error:", err),
    );
  }

  addToQueue(userId: string, event: any): void {
    if (!this.eventQueue.has(userId)) {
      this.eventQueue.set(userId, []);
    }
    const queue = this.eventQueue.get(userId);
    if (!queue) {
      return;
    }
    queue.push(event);
  }

  getQueue(userId: string): any[] {
    return this.eventQueue.get(userId) || [];
  }

  clearQueue(userId: string): void {
    this.eventQueue.delete(userId);
  }

  async addRecommend(userId: string, productId: string): Promise<void> {
    const key = `Recommend:${userId}`;
    await this.client.lpush(key, productId);
    await this.client.ltrim(key, 0, 49);
    await this.client.expire(key, 60 * 60 * 24 * 15);
  }

  async getRecentRecommend(userId: string): Promise<string[]> {
    return await this.client.lrange(`Recommend:${userId}`, 0, 49);
  }

  async setRecommendationData(
    userId: string,
    data: {
      productId: string[];
      types: string[];
      updatedAt: Date;
    },
  ): Promise<void> {
    await this.client.setex(
      `recommend:${userId}`,
      60 * 60 * 24,
      JSON.stringify(data),
    );
  }

  async getRecommendation(userId: string): Promise<{
    productIds: string[];
    categories: string[];
    updatedAt: Date;
  } | null> {
    const data = await this.client.get(`recommend:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

export const redisService = new RedisServices();
