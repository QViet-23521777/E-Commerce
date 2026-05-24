import { Context, Next } from "hono";

export const validateCreateProduct = async (c: Context, next: Next) => {
  const body = await c.req.parseBody();
  const { name, description, price, type } = body;
  const file = body["image"] as File;

  const errors: string[] = [];

  if (!name) errors.push("name là bắt buộc");
  if (!description) errors.push("description là bắt buộc");
  if (!type) errors.push("type là bắt buộc");
  if (!price || isNaN(Number(price))) errors.push("price phải là số hợp lệ");
  if (Number(price) <= 0) errors.push("price phải lớn hơn 0");
  if (!file) errors.push("image là bắt buộc");

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  await next();
};

export const validatePagination = async (c: Context, next: Next) => {
  const limit = c.req.query("limit");

  if (limit && isNaN(Number(limit))) {
    return c.json({ success: false, message: "limit phải là số" }, 400);
  }

  if (limit && Number(limit) <= 0) {
    return c.json({ success: false, message: "limit phải lớn hơn 0" }, 400);
  }

  await next();
};

export const validateSearch = async (c: Context, next: Next) => {
  const q = c.req.query("q");

  if (!q || q.trim() === "") {
    return c.json(
      { success: false, message: "Từ khóa tìm kiếm là bắt buộc" },
      400,
    );
  }

  if (q.length < 2) {
    return c.json(
      { success: false, message: "Từ khóa phải có ít nhất 2 ký tự" },
      400,
    );
  }

  await next();
};

export const validateCreateInventory = async (c: Context, next: Next) => {
  const { name, productId, quantity } = await c.req.json();
  const errors: string[] = [];

  if (!name) errors.push("name là bắt buộc");
  if (!productId) errors.push("productId là bắt buộc");
  if (quantity === undefined || isNaN(Number(quantity))) {
    errors.push("quantity phải là số hợp lệ");
  }
  if (Number(quantity) <= 0) {
    errors.push("quantity phải lớn hơn 0");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  await next();
};
