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
  searchProductsAdvanced,
  trackRecommendation,
  trackingWithoutData,
  listProductsByStatus,
  setProductStatus,
  addReview,
  replyToReview,
  moderateReview,
  reportReview,
  listSellerReviews,
  listReportedReviews,
  getProductStats,
} from "../services/product.services";

// ─── TẠO SẢN PHẨM ───────────────────────────────────
export const handleCreateProduct = async (c: Context) => {
  try {
    const body = await c.req.parseBody();
    const { name, description, price, type, point, sale, numPurchases } = body;
    // Image is optional: either an uploaded file or a pasted image URL.
    const file = body["image"] as File | undefined;
    const imageUrl = body["imageUrl"];

    if (!name || !description || !price || !type) {
      return c.json(
        { success: false, message: "Thiếu thông tin bắt buộc" },
        400,
      );
    }

    const fileBuffer =
      file && typeof file !== "string"
        ? Buffer.from(await file.arrayBuffer())
        : undefined;

    const product = await createProduct(
      name as string,
      description as string,
      Number(price),
      {
        fileBuffer,
        imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
      },
      type as string,
      point ? Number(point) : 0,
      sale ? Number(sale) : undefined,
      numPurchases ? Number(numPurchases) : undefined,
    );

    return c.json({ success: true, data: product }, 201);
  } catch (error) {
    console.error("[handleCreateProduct] error:", error);
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

// ─── STOREFRONT SEARCH (filters + sort + pagination) ────────────────────────
export const handleSearchProducts = async (c: Context) => {
  try {
    const q = c.req.query("q");
    // A query string, when present, must be at least 2 chars — but a filter-only
    // search (e.g. category + price range, no keyword) is allowed.
    if (q !== undefined && q.trim() !== "" && q.trim().length < 2) {
      return c.json(
        { success: false, message: "Từ khóa phải có ít nhất 2 ký tự" },
        400,
      );
    }

    const num = (v: string | undefined) =>
      v !== undefined && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined;

    const result = await searchProductsAdvanced({
      q: q?.trim() || undefined,
      type: c.req.query("type") || undefined,
      minPrice: num(c.req.query("minPrice")),
      maxPrice: num(c.req.query("maxPrice")),
      minRating: num(c.req.query("minRating")),
      inStock: c.req.query("inStock") === "true",
      onSale: c.req.query("onSale") === "true",
      sort: (c.req.query("sort") as any) || undefined,
      page: num(c.req.query("page")),
      limit: num(c.req.query("limit")),
    });

    return c.json({ success: true, ...result });
  } catch (error) {
    console.error("[handleSearchProducts]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleTracking = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { events } = body;
    const userId = c.req.param("userId") || "";
    if (!userId) {
      return c.json({ success: false, message: "userId là bắt buộc" }, 400);
    }
    console.log(
      "Received tracking events for userId:",
      userId,
      "events:",
      events,
    );
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
    let body: Record<string, unknown> = {};
    try {
      const text = await c.req.text();
      if (text?.trim()) body = JSON.parse(text);
    } catch {
      body = {};
    }

    const {
      lastPurchasesId = "",
      lastPurchasesNum = 0,
      lastSaleId = "",
      lastSaleNum = 0,
      lastPointId = "",
      lastPointNum = 0,
    } = body;

    const result = await trackingWithoutData(
      lastPurchasesId as string,
      Number(lastPurchasesNum),
      lastSaleId as string,
      Number(lastSaleNum),
      lastPointId as string,
      Number(lastPointNum),
    );

    return c.json({ success: true, data: result }, 200);
  } catch (error) {
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleListModeration = async (c: Context) => {
  try {
    const status = c.req.query("status") || "pending";
    const limit = Number(c.req.query("limit")) || 50;
    const products = await listProductsByStatus(status, limit);
    return c.json({ success: true, data: products });
  } catch (error) {
    console.error("[handleListModeration]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleAddReview = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const body = await c.req.json().catch(() => ({}));
    if (!body || Number(body.rating) < 1) {
      return c.json({ success: false, message: "rating là bắt buộc (1-5)" }, 400);
    }
    // Prefer the authenticated user's identity (forwarded by the gateway) for the
    // review author, falling back to whatever the client supplied.
    const author =
      body.author || c.req.header("x-user-email") || "Anonymous";
    const data = await addReview(productId, { ...body, author });
    return c.json({ success: true, data }, 201);
  } catch (error: any) {
    if (error.message === "Product does not exists") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error("[handleAddReview]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

// ─── REVIEW REPLIES & MODERATION ────────────────────────────────────────────
const reviewErrorStatus = (msg: string): number => {
  if (msg === "Product does not exists" || msg === "REVIEW_NOT_FOUND") return 404;
  if (msg === "FORBIDDEN") return 403;
  if (msg === "EMPTY_REPLY") return 400;
  return 500;
};

export const handleReplyToReview = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const index = Number(c.req.param("index"));
    const sellerId = c.req.header("x-user-id") || "";
    const body = await c.req.json().catch(() => ({}));
    const data = await replyToReview(productId, index, body.body, sellerId);
    return c.json({ success: true, data });
  } catch (error: any) {
    const msg = error?.message || "Internal server error";
    return c.json({ success: false, message: msg }, reviewErrorStatus(msg) as any);
  }
};

export const handleModerateReview = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const index = Number(c.req.param("index"));
    const body = await c.req.json().catch(() => ({}));
    const data = await moderateReview(productId, index, !!body.hidden);
    return c.json({ success: true, data });
  } catch (error: any) {
    const msg = error?.message || "Internal server error";
    return c.json({ success: false, message: msg }, reviewErrorStatus(msg) as any);
  }
};

export const handleReportReview = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const index = Number(c.req.param("index"));
    const data = await reportReview(productId, index);
    return c.json({ success: true, data });
  } catch (error: any) {
    const msg = error?.message || "Internal server error";
    return c.json({ success: false, message: msg }, reviewErrorStatus(msg) as any);
  }
};

export const handleListSellerReviews = async (c: Context) => {
  try {
    const sellerId = c.req.header("x-user-id") || "";
    if (!sellerId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
    const data = await listSellerReviews(sellerId);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("[handleListSellerReviews]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleListReportedReviews = async (c: Context) => {
  try {
    const data = await listReportedReviews();
    return c.json({ success: true, data });
  } catch (error) {
    console.error("[handleListReportedReviews]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleProductStats = async (c: Context) => {
  try {
    const data = await getProductStats();
    return c.json({ success: true, data });
  } catch (error) {
    console.error("[handleProductStats]", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleSetProductStatus = async (c: Context) => {
  try {
    const productId = c.req.param("productId") || "";
    const { status, reason } = await c.req.json();
    const product = await setProductStatus(productId, status, reason);
    return c.json({ success: true, data: product });
  } catch (error: any) {
    if (error.message === "Product does not exists") {
      return c.json({ success: false, message: error.message }, 404);
    }
    if (error.message === "INVALID_STATUS") {
      return c.json({ success: false, message: error.message }, 400);
    }
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
