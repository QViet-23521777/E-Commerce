import { Context } from "hono";
import {
  addActivity,
  flushActivity,
  getQueueStatus,
  getActivityHistory,
  getRecentActivities,
  clearActivity,
} from "../services/activity.services";

export const addActivityController = async (c: Context) => {
  try {
    const body = c.get("validatedBody");
    const result = await addActivity(body);
    return c.json(result);
  } catch (error) {
    return c.json({ success: false, message: "Lỗi khi thêm activity" }, 500);
  }
};

export const flushActivityController = async (c: Context) => {
  try {
    const userId = c.req.param("userId") || "";
    console.log("Flush request cho userId:", userId);

    const result = await flushActivity(userId);
    console.log("Flush result:", result);

    return c.json(result);
  } catch (error) {
    console.error("Flush error:", error); // ← thêm dòng này để xem lỗi cụ thể
    return c.json({ success: false, message: "Lỗi khi flush activity" }, 500);
  }
};

export const getQueueStatusController = async (c: Context) => {
  try {
    const userId = c.req.param("userId") || "";
    const result = await getQueueStatus(userId);
    return c.json(result);
  } catch (error) {
    return c.json({ success: false, message: "Lỗi khi lấy queue status" }, 500);
  }
};

export const getActivityHistoryController = async (c: Context) => {
  try {
    const userId = c.req.param("userId") || "";
    const limit = Number(c.req.query("limit")) || 20;
    const result = await getActivityHistory(userId, limit);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json(
      { success: false, message: "Lỗi khi lấy lịch sử activity" },
      500,
    );
  }
};

export const getRecentActivitiesController = async (c: Context) => {
  try {
    const userId = c.req.param("userId") || "";
    const result = await getRecentActivities(userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json(
      { success: false, message: "Lỗi khi lấy recent activities" },
      500,
    );
  }
};

export const clearActivityController = async (c: Context) => {
  try {
    const userId = c.req.param("userId") || "";
    const result = await clearActivity(userId);
    return c.json(result);
  } catch (error) {
    return c.json({ success: false, message: "Lỗi khi xóa activity" }, 500);
  }
};
