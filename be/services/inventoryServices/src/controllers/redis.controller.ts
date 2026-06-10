import { Context } from "hono";
import { redisService } from "../services/redis.service";

// ─── LẤY RECOMMENDATIONS CHO USER ────────────────────
export const handleGetRecommendations = async (c: Context) => {
  try {
    const userId = c.req.param("userId")?.toString() || "";
    if (!userId) {
      return c.json({ success: false, message: "userId là bắt buộc" }, 400);
    }

    const recommendations = await redisService.getRecommendation(userId);
    if (!recommendations) {
      return c.json(
        {
          success: false,
          message: "Không có recommendations cho user này",
        },
        404,
      );
    }

    return c.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── LẤY RECENT RECOMMENDATIONS CHO USER ─────────────
export const handleGetRecentRecommendations = async (c: Context) => {
  try {
    const userId = c.req.param("userId")?.toString() || "";
    if (!userId) {
      return c.json({ success: false, message: "userId là bắt buộc" }, 400);
    }

    const productIds = await redisService.getRecentRecommend(userId);
    if (!productIds || productIds.length === 0) {
      return c.json(
        {
          success: false,
          message: "Không có recent recommendations cho user này",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: {
        userId,
        productIds,
        count: productIds.length,
      },
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── THÊM PRODUCT VÀO RECOMMENDATIONS ───────────────
export const handleAddRecommendation = async (c: Context) => {
  try {
    const userId = c.req.param("userId")?.toString() || "";
    const { productId } = await c.req.json();

    if (!userId || !productId) {
      return c.json(
        { success: false, message: "userId và productId là bắt buộc" },
        400,
      );
    }

    await redisService.addRecommend(userId, productId);
    return c.json({
      success: true,
      message: "Thêm recommendation thành công",
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
