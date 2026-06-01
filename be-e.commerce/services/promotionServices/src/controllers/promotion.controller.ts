import { Context } from "hono";
import {
  createPromotion,
  deletePromotion,
  getPromotionByCode,
  getPromotionById,
  listActivePromotions,
  listPromotions,
  redeemPromotion,
  updatePromotion,
  validatePromotion,
} from "../services/promotion.service";

const getErrorStatus = (message: string) => {
  if (message === "Promotion not found") return 404;
  if (message.includes("duplicate key")) return 409;
  return 400;
};

export const createPromotionController = async (c: Context) => {
  try {
    const body = c.get("validatedBody");
    const promotion = await createPromotion(body);
    return c.json({ success: true, data: promotion }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const listPromotionsController = async (c: Context) => {
  try {
    const activeQuery = c.req.query("active");
    const active =
      activeQuery === undefined ? undefined : activeQuery.toLowerCase() === "true";
    const limit = Number(c.req.query("limit")) || 20;
    const page = Number(c.req.query("page")) || 1;
    const result = await listPromotions({ active, limit, page });
    return c.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list promotions";
    return c.json({ success: false, message }, 400);
  }
};

export const listActivePromotionsController = async (c: Context) => {
  try {
    const promotions = await listActivePromotions();
    return c.json({ success: true, data: promotions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list active promotions";
    return c.json({ success: false, message }, 400);
  }
};

export const getPromotionByIdController = async (c: Context) => {
  try {
    const promotionId = c.req.param("promotionId") || "";
    const promotion = await getPromotionById(promotionId);
    return c.json({ success: true, data: promotion });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const getPromotionByCodeController = async (c: Context) => {
  try {
    const code = c.req.param("code") || "";
    const promotion = await getPromotionByCode(code);
    return c.json({ success: true, data: promotion });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const updatePromotionController = async (c: Context) => {
  try {
    const promotionId = c.req.param("promotionId") || "";
    const body = c.get("validatedBody");
    const promotion = await updatePromotion(promotionId, body);
    return c.json({ success: true, data: promotion });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const deletePromotionController = async (c: Context) => {
  try {
    const promotionId = c.req.param("promotionId") || "";
    const promotion = await deletePromotion(promotionId);
    return c.json({ success: true, data: promotion });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const validatePromotionController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const body = c.get("validatedBody");
    const result = await validatePromotion(user.id, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to validate promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};

export const redeemPromotionController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const body = c.get("validatedBody");
    const result = await redeemPromotion(user.id, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to redeem promotion";
    return c.json({ success: false, message }, getErrorStatus(message));
  }
};
