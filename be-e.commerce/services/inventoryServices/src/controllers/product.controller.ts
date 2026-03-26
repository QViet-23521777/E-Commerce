import { Context } from "hono";
import {
  createProduct,
  getProductById,
  getTopProductPurchases,
  getTopSale,
  getTopPoint,
  getTopByType,
  getTopByListType,
  findProduct,
  trackRecommendation,
  trackingWithoutData,
} from "../services/product.services";

// ─── TẠO SẢN PHẨM ───────────────────────────────────
export const handleCreateProduct = async (c: Context) => {
  try {
    const body = await c.req.parseBody();
    const { name, description, price, type, point, sale, numPurchases } = body;
    const file = body["image"] as File;

    if (!name || !description || !price || !type || !file) {
      return c.json(
        { success: false, message: "Thiếu thông tin bắt buộc" },
        400,
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const product = await createProduct(
      name as string,
      description as string,
      Number(price),
      fileBuffer,
      type as string,
      point ? Number(point) : 0,
      sale ? Number(sale) : undefined,
      numPurchases ? Number(numPurchases) : undefined,
    );

    return c.json({ success: true, data: product }, 201);
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── LẤY SẢN PHẨM THEO ID ───────────────────────────
export const ProductById = async (c: Context) => {
  try {
    const productId = c.req.param("productId")?.toString() || "";
    const product = await getProductById(productId);
    return c.json({ success: true, data: product });
  } catch (error: any) {
    if (error.message === "Product does not exists") {
      return c.json({ success: false, message: error.message }, 404);
    }
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TOP SẢN PHẨM THEO LƯỢT MUA ─────────────────────
export const handleGetTopPurchases = async (c: Context) => {
  try {
    const limit = Number(c.req.query("limit")) || 10;
    const lastnumPurchases = c.req.query("lastnumPurchases")
      ? Number(c.req.query("lastnumPurchases"))
      : undefined;
    const lastId = c.req.query("lastId");

    const result = await getTopProductPurchases(
      limit,
      lastnumPurchases,
      lastId,
    );
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TOP SẢN PHẨM THEO SALE ─────────────────────────
export const handleGetTopSale = async (c: Context) => {
  try {
    const limit = Number(c.req.query("limit")) || 10;
    const lastSale = Number(c.req.query("lastSale")) || 0;
    const lastId = c.req.query("lastId") || "";

    const result = await getTopSale(limit, lastSale, lastId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TOP SẢN PHẨM THEO ĐIỂM ─────────────────────────
export const handleGetTopPoint = async (c: Context) => {
  try {
    const limit = Number(c.req.query("limit")) || 10;
    const lastPoint = Number(c.req.query("lastPoint")) || 0;
    const lastId = c.req.query("lastId") || "";

    const result = await getTopPoint(limit, lastPoint, lastId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TOP SẢN PHẨM THEO LOẠI ─────────────────────────
export const handleGetTopByType = async (c: Context) => {
  try {
    const type = c.req.param("type")?.toString() || "";
    const limit = Number(c.req.query("limit")) || 10;
    const lastId = c.req.query("lastId") || "";

    const result = await getTopByType(limit, lastId, type);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TOP SẢN PHẨM THEO NHIỀU LOẠI ───────────────────
export const handleGetTopByListType = async (c: Context) => {
  try {
    const limit = Number(c.req.query("limit")) || 2;
    const typeQuery = c.req.query("type");

    if (!typeQuery) {
      return c.json({ success: false, message: "type là bắt buộc" }, 400);
    }

    // type=shoes,shirt,pants → ["shoes", "shirt", "pants"]
    const type = typeQuery.split(",");

    const result = await getTopByListType(limit, type);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── TÌM KIẾM SẢN PHẨM ──────────────────────────────
export const handleFindProduct = async (c: Context) => {
  try {
    const find = c.req.query("q");

    if (!find) {
      return c.json(
        { success: false, message: "Từ khóa tìm kiếm là bắt buộc" },
        400,
      );
    }

    const limit = Number(c.req.query("limit")) || 10;
    const lastTrack = c.req.query("lastTrack")
      ? Number(c.req.query("lastTrack"))
      : undefined;
    const lastId = c.req.query("lastId");

    const result = await findProduct(find, limit, lastTrack, lastId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleTracking = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { userId, events } = body;
    if (!userId) {
      return c.json({ success: false, message: "userId là bắt buộc" }, 400);
    }

    if (!Array.isArray(events) || events.length === 0) {
      const result = await trackingWithoutData();
      return c.json({ success: true, ...result });
    }
    const validActivities = ["view", "search", "click", "buy"];
    for (const event of events) {
      if (!validActivities.includes(event.activity)) {
        return c.json(
          {
            success: false,
            message: `activity không hợp lệ: ${event.activity}`,
          },
          400,
        );
      }
      if (event.activity === "search" && !event.keyword) {
        return c.json(
          {
            success: false,
            message: "keyword là bắt buộc khi activity là search",
          },
          400,
        );
      }
    }
    const result = await trackRecommendation({ userId, events });
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleTrackingWithoutData = async (c: Context) => {
  try {
    const result = await trackingWithoutData();
    return c.json({ success: true, data: result }, 200);
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
