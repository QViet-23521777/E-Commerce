import { UserActivityModel } from "../model/activity.model";
import { redisService } from "./redis.service";
import { kafkaService } from "./kafka.service";
import { ActivityType, UserActivity } from "./redis.service";

const INVENTORY_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:3000";
const RECOMMEND_COOLDOWN_MS = 60 * 1000;

const lastRecommendCall = new Map<string, number>();

const shouldCallRecommend = (userId: string): boolean => {
  const last = lastRecommendCall.get(userId) ?? 0;
  return Date.now() - last > RECOMMEND_COOLDOWN_MS;
};

const callRecommend = async (userId: string, events: UserActivity[]) => {
  console.log("Should call recommend for userId?", userId, "events:", events);
  const shouldCall = shouldCallRecommend(userId);
  console.log("shouldCallRecommend result:", shouldCall); // do colldown nên bị null
  if (!shouldCall) {
    return null;
  }
  const hasSignal = events.some(
    (e) =>
      e.activity === "view" ||
      e.activity === "click" ||
      e.activity === "buy" ||
      e.activity === "search",
  );
  if (!hasSignal) return null;

  lastRecommendCall.set(userId, Date.now());

  try {
    const res = await fetch(
      `${INVENTORY_URL}/api/products/recommend/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, events }),
      },
    );

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    console.warn("⚠️ Recommend service unavailable, skipping");
    return null;
  }
};

const flushBatch = async (userId: string) => {
  const queue = redisService.getQueue(userId);
  if (queue.length === 0) return { flushed: 0 };

  const flushedCount = queue.length;
  redisService.clearQueue(userId);

  await UserActivityModel.insertMany(
    queue.map((event) => ({ ...event, userId })),
  );
  for (const event of queue) {
    switch (event.activity) {
      case "view":
        if (event.productId)
          await redisService.addRecentView(userId, event.productId);
        break;
      case "search":
        if (event.keyword)
          await redisService.addSearchHistory(userId, event.keyword);
        break;
      case "buy":
        if (event.productId)
          await redisService.addRecentPurchase(userId, event.productId);
        break;
      case "click":
        if (event.productId)
          await redisService.addClick(userId, event.productId);
        break;
    }
  }
  console.log(
    `Flushed ${flushedCount} events for userId ${userId}, queue: `,
    queue,
  ); //ở đây có nhưng vào services thì không track được
  const recommendData = await callRecommend(userId, queue);
  console.log("Recommend data:", recommendData);
  try {
    await kafkaService.publishActivity({
      userId,
      events: queue,
      totalEvents: flushedCount,
      timestamp: new Date(),
    });
  } catch (err) {
    console.warn("⚠️ Kafka unavailable, skipping publish");
  }

  return {
    flushed: flushedCount,
    recommendData,
  };
};

export const addActivity = async (data: {
  userId: string;
  activity: ActivityType;
  productId?: string;
  keyword?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (!data.activity) {
    return {
      queued: false,
      message: "Thiếu field activity (view | buy | search | click)",
      queueSize: 0,
    };
  }

  const queue = redisService.getQueue(data.userId);

  if (queue.length >= 20) {
    return {
      queued: false,
      message: "Queue đã đầy 20 events, vui lòng flush trước",
      queueSize: queue.length,
    };
  }

  const event: UserActivity = {
    activity: data.activity,
    productId: data.productId,
    keyword: data.keyword,
    timestamp: Date.now(),
    count: 0,
  };

  const shouldFlush = redisService.addToQueue(data.userId, event);

  if (shouldFlush) {
    const result = await flushBatch(data.userId);
    return {
      queued: true,
      message: "Đủ 10 events → đã flush",
      flushed: result.flushed,
      queueSize: redisService.getQueue(data.userId).length,
      recommendData: result.recommendData,
    };
  }

  return {
    queued: true,
    message: "Đã thêm vào queue",
    queueSize: redisService.getQueue(data.userId).length,
  };
};

export const flushActivity = async (userId: string) => {
  const queue = redisService.getQueue(userId);

  if (queue.length === 0) {
    return { success: false, message: "Queue đang trống" };
  }

  const result = await flushBatch(userId);

  return {
    success: true,
    message: `Đã flush ${result.flushed} events`,
    flushed: result.flushed,
    data: result.recommendData ?? null,
  };
};

export const getQueueStatus = async (userId: string) => {
  const queue = redisService.getQueue(userId);
  return {
    userId,
    queueSize: queue.length,
    events: queue,
  };
};

export const getActivityHistory = async (
  userId: string,
  limit: number = 20,
) => {
  return await UserActivityModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const getRecentActivities = async (userId: string) => {
  const [views, searches, purchases, clicks] = await Promise.all([
    redisService.getHistoryByActivity(userId, "view"),
    redisService.getHistoryByActivity(userId, "search"),
    redisService.getHistoryByActivity(userId, "buy"),
    redisService.getHistoryByActivity(userId, "click"),
  ]);

  return { userId, views, searches, purchases, clicks };
};

export const clearActivity = async (userId: string) => {
  const queueSize = redisService.getQueue(userId).length;
  redisService.clearQueue(userId);
  return {
    success: true,
    message: `Đã xóa ${queueSize} events khỏi queue`,
  };
};
