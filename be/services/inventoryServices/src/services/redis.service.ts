import Redis from "ioredis";
import { config } from "../config";

export type RecommendCursors = {
  lastFindId: string;
  lastFindTrack: number;
  lastTopByTypeId: string;
  lastTopByTypeSale?: number;
  lastTopByTypeNumPurchases?: number;
  lastTopByTypePoint?: number;
  lastPurchasesId: string;
  lastPurchasesNum: number;
  lastSaleId: string;
  lastSaleNum: number;
  lastPointId: string;
  lastPointNum: number;
};

type RecommendData = {
  productIds: string[];
  categories: string[];
  cursors: RecommendCursors;
  hasMore: boolean;
  updatedAt: Date;
};

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
    if (!queue) return;
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

  async setRecommendationData(userId: string, data: RecommendData): Promise<void> {
    await this.client.setex(
      `recommend:${userId}`,
      60 * 60 * 24,
      JSON.stringify(data),
    );
  }

  async getRecommendation(userId: string): Promise<RecommendData | null> {
    const data = await this.client.get(`recommend:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async appendRecommendation(
    userId: string,
    newProductIds: string[],
    cursors: RecommendCursors,
    hasMore: boolean,
  ): Promise<void> {
    const cached = await this.getRecommendation(userId);
    const merged = [...new Set([...(cached?.productIds ?? []), ...newProductIds])];
    await this.setRecommendationData(userId, {
      productIds: merged,
      categories: cached?.categories ?? [],
      cursors,
      hasMore,
      updatedAt: new Date(),
    });
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

export const redisService = new RedisServices();
