import { Hono } from "hono";
import {
  createPromotionController,
  deletePromotionController,
  getPromotionByCodeController,
  getPromotionByIdController,
  listActivePromotionsController,
  listPromotionsController,
  redeemPromotionController,
  updatePromotionController,
  validatePromotionController,
} from "../controllers/promotion.controller";
import { extractUser } from "../middleware/extractUser";
import { internalAuth } from "../middleware/internalAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  validateCreatePromotion,
  validatePromotionCheck,
  validateUpdatePromotion,
} from "../middleware/validatePromotion";

const promotionRoutes = new Hono();

promotionRoutes.use("*", internalAuth);

promotionRoutes.get("/", extractUser, requireAdmin, listPromotionsController);
promotionRoutes.get("/active", listActivePromotionsController);
promotionRoutes.get("/code/:code", getPromotionByCodeController);
promotionRoutes.post(
  "/validate",
  extractUser,
  validatePromotionCheck,
  validatePromotionController,
);
promotionRoutes.post(
  "/redeem",
  extractUser,
  validatePromotionCheck,
  redeemPromotionController,
);
promotionRoutes.post(
  "/",
  extractUser,
  requireAdmin,
  validateCreatePromotion,
  createPromotionController,
);
promotionRoutes.get(
  "/:promotionId",
  extractUser,
  requireAdmin,
  getPromotionByIdController,
);
promotionRoutes.patch(
  "/:promotionId",
  extractUser,
  requireAdmin,
  validateUpdatePromotion,
  updatePromotionController,
);
promotionRoutes.delete(
  "/:promotionId",
  extractUser,
  requireAdmin,
  deletePromotionController,
);

export default promotionRoutes;
