import { Hono } from "hono";
import {
  validateCreateProduct,
  validatePagination,
} from "../middleware/validate.middleware";
import {
  handleCreateProduct,
  ProductById,
  handleGetTopPurchases,
  handleGetTopSale,
  handleGetTopPoint,
  handleGetTopByType,
  handleGetTopByListType,
  handleSearchProducts,
  handleTracking,
  handleTrackingWithoutData,
  handleListModeration,
  handleSetProductStatus,
  handleAddReview,
  handleReplyToReview,
  handleModerateReview,
  handleReportReview,
  handleListSellerReviews,
  handleListReportedReviews,
  handleProductStats,
} from "../controllers/product.controller";
import { sanitizeRequestBody } from "../middleware/sanitize";

const router = new Hono();
router.use("*", sanitizeRequestBody);

router.post("/", validateCreateProduct, handleCreateProduct);

router.get("/search", validatePagination, handleSearchProducts);

router.get("/top/purchases", validatePagination, handleGetTopPurchases);
router.get("/top/sale", validatePagination, handleGetTopSale);
router.get("/top/point", validatePagination, handleGetTopPoint);
router.get("/top/list-type", validatePagination, handleGetTopByListType);
router.get("/top/type/:type", validatePagination, handleGetTopByType);
router.post("/recommend", handleTrackingWithoutData);
router.post("/recommend/:userId", validatePagination, handleTracking);

router.get("/moderation", handleListModeration);
router.get("/stats", handleProductStats);

// Review replies & moderation (specific routes before the catch-all /:productId)
router.get("/reviews/seller", handleListSellerReviews);
router.get("/reviews/reported", handleListReportedReviews);
router.post("/:productId/reviews/:index/reply", handleReplyToReview);
router.patch("/:productId/reviews/:index/moderate", handleModerateReview);
router.post("/:productId/reviews/:index/report", handleReportReview);

router.patch("/:productId/status", handleSetProductStatus);
router.post("/:productId/reviews", handleAddReview);

router.get("/:productId", ProductById);

export default router;
