import Redis from "ioredis";
import { config } from "../config";

export type ActivityType = "view" | "buy" | "search" | "click";

export interface UserActivity {
  activity: ActivityType;
  productId?: string;
  keyword?: string;
  timestamp: number;
  count: number;
}

class RedisServices {
  private client: Redis;

  private eventQueue: Map<string, UserActivity[]> = new Map();
  private readonly BATCH_SIZE = 10;
  private readonly MAX_QUEUE_SIZE = 20;

  private readonly TTL_WEEK = 60 * 60 * 24 * 7;
  private readonly TTL_MONTH = 60 * 60 * 24 * 30;
  private readonly TTL_HOUR = 60 * 60;

  private readonly MAX_ACTIVITY_HISTORY = 100;

  constructor() {
    this.client = new Redis(config.redisUrl);
    this.client.on("error", (err) => console.error("❌ Redis error:", err));
  }

  private activityKey = (userId: string) => `activity:${userId}`;
  private countKey = (userId: string, activity: ActivityType, id: string) =>
    `activity_count:${userId}:${activity}:${id}`;
  private sessionKey = (sessionId: string) => `session:${sessionId}`;
  private rateKey = (userId: string) => `rate:${userId}`;

  addToQueue(userId: string, event: UserActivity): boolean {
    if (!this.eventQueue.has(userId)) {
      this.eventQueue.set(userId, []);
    }

    const queue = this.eventQueue.get(userId)!;
    if (queue.length >= this.MAX_QUEUE_SIZE) return true;
    queue.push(event);

    return queue.length >= this.BATCH_SIZE;
  }

  getQueue(userId: string): UserActivity[] {
    return this.eventQueue.get(userId) ?? [];
  }

  clearQueue(userId: string): void {
    this.eventQueue.delete(userId);
  }

  private async pushActivity(
    userId: string,
    activity: Omit<UserActivity, "timestamp" | "count">,
    ttl: number,
  ): Promise<void> {
    const id = activity.productId ?? activity.keyword ?? "";
    const cntKey = this.countKey(userId, activity.activity, id);
    const actKey = this.activityKey(userId);

    const count = await this.client.incr(cntKey);
    await this.client.expire(cntKey, ttl);

    const entry: UserActivity = {
      ...activity,
      timestamp: Date.now(),
      count,
    };

    await this.client.lpush(actKey, JSON.stringify(entry));
    await this.client.ltrim(actKey, 0, this.MAX_ACTIVITY_HISTORY - 1);
    await this.client.expire(actKey, ttl);
  }

  async addRecentView(userId: string, productId: string): Promise<void> {
    await this.pushActivity(
      userId,
      { activity: "view", productId },
      this.TTL_WEEK,
    );
  }

  async addRecentPurchase(userId: string, productId: string): Promise<void> {
    await this.pushActivity(
      userId,
      { activity: "buy", productId },
      this.TTL_MONTH,
    );
  }

  async addSearchHistory(userId: string, keyword: string): Promise<void> {
    await this.pushActivity(
      userId,
      { activity: "search", keyword },
      this.TTL_WEEK,
    );
  }

  async addClick(userId: string, productId: string): Promise<void> {
    await this.pushActivity(
      userId,
      { activity: "click", productId },
      this.TTL_WEEK,
    );
  }

  async getFullHistory(userId: string): Promise<UserActivity[]> {
    const raw = await this.client.lrange(this.activityKey(userId), 0, -1);
    return raw.map((r) => JSON.parse(r) as UserActivity);
  }

  async getHistoryByActivity(
    userId: string,
    activity: ActivityType,
  ): Promise<UserActivity[]> {
    const all = await this.getFullHistory(userId);
    return all.filter((a) => a.activity === activity);
  }

  async getRecentView(userId: string): Promise<UserActivity[]> {
    return this.getHistoryByActivity(userId, "view");
  }

  async getRecentPurchase(userId: string): Promise<UserActivity[]> {
    return this.getHistoryByActivity(userId, "buy");
  }

  async getSearchHistory(userId: string): Promise<UserActivity[]> {
    return this.getHistoryByActivity(userId, "search");
  }

  async getActivityCount(
    userId: string,
    activity: ActivityType,
    id: string,
  ): Promise<number> {
    const val = await this.client.get(this.countKey(userId, activity, id));
    return val ? parseInt(val, 10) : 0;
  }

  async setSession(sessionId: string, data: object): Promise<void> {
    await this.client.setex(
      this.sessionKey(sessionId),
      1800,
      JSON.stringify(data),
    );
  }

  async getSession(sessionId: string): Promise<object | null> {
    const data = await this.client.get(this.sessionKey(sessionId));
    return data ? (JSON.parse(data) as object) : null;
  }

  async checkRateLimit(userId: string): Promise<boolean> {
    const key = this.rateKey(userId);
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, 60);
    return count <= 100;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redisService = new RedisServices();
