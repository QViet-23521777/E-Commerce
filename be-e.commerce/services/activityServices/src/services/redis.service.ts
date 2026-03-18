import Redis from "ioredis";
import { config } from "../config";

class RedisServices {
  private client: Redis;
  private eventQueue: Map<string, any[]> = new Map(); // queue lưu tạm event
  private BATCH_SIZE = 10; // xử lý khi đủ 10 event

  constructor() {
    this.client = new Redis(config.redisUrl);
    this.client.on("connect", () => console.log("✅ Redis connected"));
    this.client.on("error", (err) => console.error("❌ Redis error:", err));
  }

  addToQueue(userId: string, event: any): boolean {
    if (!this.eventQueue.has(userId)) {
      this.eventQueue.set(userId, []);
    }

    const queue = this.eventQueue.get(userId)!;
    queue.push(event);

    return queue.length >= this.BATCH_SIZE;
  }

  getQueue(userId: string): any[] {
    return this.eventQueue.get(userId) || [];
  }

  clearQueue(userId: string): void {
    this.eventQueue.delete(userId);
  }

  async addRecentView(userId: string, productId: string): Promise<void> {
    const key = `recent_views:${userId}`;
    await this.client.lpush(key, productId);
    await this.client.ltrim(key, 0, 49);
    await this.client.expire(key, 60 * 60 * 24 * 7);
  }

  async getRecentView(userId: string): Promise<string[]> {
    return await this.client.lrange(`recent_views:${userId}`, 0, 49);
  }

  async addSearchHistory(userId: string, keyword: string): Promise<void> {
    const key = `recent_history:${userId}`;
    await this.client.lpush(key, keyword);
    await this.client.ltrim(key, 0, 10);
    await this.client.expire(key, 60 * 60 * 24 * 7);
  }

  async getSearchHistory(userId: string): Promise<string[]> {
    return await this.client.lrange(`recent_history:${userId}`, 0, 10);
  }

  async addRecentPurchase(userId: string, productId: string): Promise<void> {
    const key = `recent_purchases:${userId}`;
    await this.client.lpush(key, productId);
    await this.client.ltrim(key, 0, 7);
    await this.client.expire(key, 60 * 60 * 24 * 30);
  }

  async getRecentPurchase(userId: string): Promise<string[]> {
    return await this.client.lrange(`recent_purchases:${userId}`, 0, 7);
  }

  async setRecommendation(userId: string, productIds: string[]): Promise<void> {
    await this.client.setex(
      `recommend:${userId}`,
      60 * 60,
      JSON.stringify(productIds),
    );
  }

  async getRecommendation(userId: string): Promise<string[] | null> {
    const data = await this.client.get(`recommend:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async setSession(sessionId: string, data: object): Promise<void> {
    await this.client.setex(`session:${sessionId}`, 1800, JSON.stringify(data));
  }

  async getSession(sessionId: string): Promise<object | null> {
    const data = await this.client.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `rate:${userId}`;
    const count = await this.client.incr(key);
    if (count == 1) await this.client.expire(key, 60);
    return count <= 100;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redisService = new RedisServices();
