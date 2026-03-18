import { UserActivityModel } from "../model/activity.model";
import { redisService } from "./redis.service";
import { kafkaService } from "./kafka.service";

const flushBatch = async (userId: string, clearAfter: boolean = false) => {
  const queue = redisService.getQueue(userId);
  if (queue.length === 0) return { flushed: 0 };

  console.log(`Flush ${queue.length} events cho user: ${userId}`);

  await UserActivityModel.insertMany(queue);

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
          await redisService.addRecentView(userId, event.productId);
        break;
    }
  }

  for (const event of queue) {
    await kafkaService.publishActivity(event);
  }

  const flushedCount = queue.length;

  if (clearAfter) {
    redisService.clearQueue(userId);
  }

  return { flushed: flushedCount };
};

export const addActivity = async (data: {
  userId: string;
  activity: "view" | "search" | "click" | "buy";
  productId?: string;
  keyword?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}) => {
  const event = { ...data, timestamp: new Date() };
  const queue = redisService.getQueue(data.userId);

  if (queue.length >= 20) {
    return {
      queued: false,
      message: `Queue đã đầy 20 events, vui lòng flush trước`,
      queueSize: queue.length,
    };
  }
  const shouldFlush = redisService.addToQueue(data.userId, event);

  if (shouldFlush) {
    const result = await flushBatch(data.userId);
    return {
      queued: true,
      message: `Đủ 10 events → đã flush, queue vẫn giữ`,
      flushed: result.flushed,
      queueSize: redisService.getQueue(data.userId).length,
    };
  }

  return {
    queued: true,
    message: `Đã thêm vào queue`,
    queueSize: redisService.getQueue(data.userId).length,
  };
};

export const flushActivity = async (userId: string) => {
  const queueSize = redisService.getQueue(userId).length;

  if (queueSize === 0) {
    return { success: false, message: "Queue đang trống" };
  }

  const result = await flushBatch(userId);
  return {
    success: true,
    message: `Đã flush ${result.flushed} events`,
    flushed: result.flushed,
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
  const [recentViews, searchHistory, recentPurchases] = await Promise.all([
    redisService.getRecentView(userId),
    redisService.getSearchHistory(userId),
    redisService.getRecentPurchase(userId),
  ]);

  return { recentViews, searchHistory, recentPurchases };
};

export const clearActivity = async (userId: string) => {
  const queueSize = redisService.getQueue(userId).length;
  redisService.clearQueue(userId);
  return {
    success: true,
    message: `Đã xóa ${queueSize} events khỏi queue`,
  };
};
