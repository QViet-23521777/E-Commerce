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

// List is shared: admins see all promotions, sellers see only their own
// vouchers (scoped in the controller via the authenticated user).
promotionRoutes.get("/", extractUser, listPromotionsController);
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
// Create / update / delete are shared by admins (global promotions) and
// sellers (shop vouchers). The controller scopes non-admins to their own
// promotions, so no admin gate here.
promotionRoutes.post(
  "/",
  extractUser,
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
  validateUpdatePromotion,
  updatePromotionController,
);
promotionRoutes.delete(
  "/:promotionId",
  extractUser,
  deletePromotionController,
);

export default promotionRoutes;
