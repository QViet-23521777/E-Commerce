"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSearch = exports.validatePagination = exports.validateCreateProduct = void 0;
const validateCreateProduct = async (c, next) => {
    const body = await c.req.parseBody();
    const { name, description, price, type } = body;
    const file = body["image"];
    const errors = [];
    if (!name)
        errors.push("name là bắt buộc");
    if (!description)
        errors.push("description là bắt buộc");
    if (!type)
        errors.push("type là bắt buộc");
    if (!price || isNaN(Number(price)))
        errors.push("price phải là số hợp lệ");
    if (Number(price) <= 0)
        errors.push("price phải lớn hơn 0");
    if (!file)
        errors.push("image là bắt buộc");
    if (errors.length > 0) {
        return c.json({ success: false, errors }, 400);
    }
    await next();
};
exports.validateCreateProduct = validateCreateProduct;
const validatePagination = async (c, next) => {
    const limit = c.req.query("limit");
    if (limit && isNaN(Number(limit))) {
        return c.json({ success: false, message: "limit phải là số" }, 400);
    }
    if (limit && Number(limit) <= 0) {
        return c.json({ success: false, message: "limit phải lớn hơn 0" }, 400);
    }
    await next();
};
exports.validatePagination = validatePagination;
const validateSearch = async (c, next) => {
    const q = c.req.query("q");
    if (!q || q.trim() === "") {
        return c.json({ success: false, message: "Từ khóa tìm kiếm là bắt buộc" }, 400);
    }
    if (q.length < 2) {
        return c.json({ success: false, message: "Từ khóa phải có ít nhất 2 ký tự" }, 400);
    }
    await next();
};
exports.validateSearch = validateSearch;
//# sourceMappingURL=validate.middleware.js.map