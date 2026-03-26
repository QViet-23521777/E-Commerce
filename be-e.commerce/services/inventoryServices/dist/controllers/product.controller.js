"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTrackingWithoutData = exports.handleTracking = exports.handleFindProduct = exports.handleGetTopByListType = exports.handleGetTopByType = exports.handleGetTopPoint = exports.handleGetTopSale = exports.handleGetTopPurchases = exports.ProductById = exports.handleCreateProduct = void 0;
const product_services_1 = require("../services/product.services");
// ─── TẠO SẢN PHẨM ───────────────────────────────────
const handleCreateProduct = async (c) => {
    try {
        const body = await c.req.parseBody();
        const { name, description, price, type, point, sale, numPurchases } = body;
        const file = body["image"];
        if (!name || !description || !price || !type || !file) {
            return c.json({ success: false, message: "Thiếu thông tin bắt buộc" }, 400);
        }
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const product = await (0, product_services_1.createProduct)(name, description, Number(price), fileBuffer, type, point ? Number(point) : 0, sale ? Number(sale) : undefined, numPurchases ? Number(numPurchases) : undefined);
        return c.json({ success: true, data: product }, 201);
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleCreateProduct = handleCreateProduct;
// ─── LẤY SẢN PHẨM THEO ID ───────────────────────────
const ProductById = async (c) => {
    try {
        const productId = c.req.param("productId")?.toString() || "";
        const product = await (0, product_services_1.getProductById)(productId);
        return c.json({ success: true, data: product });
    }
    catch (error) {
        if (error.message === "Product does not exists") {
            return c.json({ success: false, message: error.message }, 404);
        }
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.ProductById = ProductById;
// ─── TOP SẢN PHẨM THEO LƯỢT MUA ─────────────────────
const handleGetTopPurchases = async (c) => {
    try {
        const limit = Number(c.req.query("limit")) || 10;
        const lastnumPurchases = c.req.query("lastnumPurchases")
            ? Number(c.req.query("lastnumPurchases"))
            : undefined;
        const lastId = c.req.query("lastId");
        const result = await (0, product_services_1.getTopProductPurchases)(limit, lastnumPurchases, lastId);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleGetTopPurchases = handleGetTopPurchases;
// ─── TOP SẢN PHẨM THEO SALE ─────────────────────────
const handleGetTopSale = async (c) => {
    try {
        const limit = Number(c.req.query("limit")) || 10;
        const lastSale = Number(c.req.query("lastSale")) || 0;
        const lastId = c.req.query("lastId") || "";
        const result = await (0, product_services_1.getTopSale)(limit, lastSale, lastId);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleGetTopSale = handleGetTopSale;
// ─── TOP SẢN PHẨM THEO ĐIỂM ─────────────────────────
const handleGetTopPoint = async (c) => {
    try {
        const limit = Number(c.req.query("limit")) || 10;
        const lastPoint = Number(c.req.query("lastPoint")) || 0;
        const lastId = c.req.query("lastId") || "";
        const result = await (0, product_services_1.getTopPoint)(limit, lastPoint, lastId);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleGetTopPoint = handleGetTopPoint;
// ─── TOP SẢN PHẨM THEO LOẠI ─────────────────────────
const handleGetTopByType = async (c) => {
    try {
        const type = c.req.param("type")?.toString() || "";
        const limit = Number(c.req.query("limit")) || 10;
        const lastId = c.req.query("lastId") || "";
        const result = await (0, product_services_1.getTopByType)(limit, lastId, type);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleGetTopByType = handleGetTopByType;
// ─── TOP SẢN PHẨM THEO NHIỀU LOẠI ───────────────────
const handleGetTopByListType = async (c) => {
    try {
        const limit = Number(c.req.query("limit")) || 2;
        const typeQuery = c.req.query("type");
        if (!typeQuery) {
            return c.json({ success: false, message: "type là bắt buộc" }, 400);
        }
        // type=shoes,shirt,pants → ["shoes", "shirt", "pants"]
        const type = typeQuery.split(",");
        const result = await (0, product_services_1.getTopByListType)(limit, type);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleGetTopByListType = handleGetTopByListType;
// ─── TÌM KIẾM SẢN PHẨM ──────────────────────────────
const handleFindProduct = async (c) => {
    try {
        const find = c.req.query("q");
        if (!find) {
            return c.json({ success: false, message: "Từ khóa tìm kiếm là bắt buộc" }, 400);
        }
        const limit = Number(c.req.query("limit")) || 10;
        const lastTrack = c.req.query("lastTrack")
            ? Number(c.req.query("lastTrack"))
            : undefined;
        const lastId = c.req.query("lastId");
        const result = await (0, product_services_1.findProduct)(find, limit, lastTrack, lastId);
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleFindProduct = handleFindProduct;
const handleTracking = async (c) => {
    try {
        const body = await c.req.json();
        const { userId, events } = body;
        if (!userId) {
            return c.json({ success: false, message: "userId là bắt buộc" }, 400);
        }
        if (!Array.isArray(events) || events.length === 0) {
            const result = await (0, product_services_1.trackingWithoutData)();
            return c.json({ success: true, ...result });
        }
        const validActivities = ["view", "search", "click", "buy"];
        for (const event of events) {
            if (!validActivities.includes(event.activity)) {
                return c.json({
                    success: false,
                    message: `activity không hợp lệ: ${event.activity}`,
                }, 400);
            }
            if (event.activity === "search" && !event.keyword) {
                return c.json({
                    success: false,
                    message: "keyword là bắt buộc khi activity là search",
                }, 400);
            }
        }
        const result = await (0, product_services_1.trackRecommendation)({ userId, events });
        return c.json({ success: true, ...result });
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleTracking = handleTracking;
const handleTrackingWithoutData = async (c) => {
    try {
        const result = await (0, product_services_1.trackingWithoutData)();
        return c.json({ success: true, data: result }, 200);
    }
    catch (error) {
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
};
exports.handleTrackingWithoutData = handleTrackingWithoutData;
//# sourceMappingURL=product.controller.js.map