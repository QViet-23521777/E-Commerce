import { Hono } from "hono";
import {
  validateCreateProduct,
  validatePagination,
  validateSearch,
} from "../middleware/validate.middleware";
import {
  handleCreateProduct,
  ProductById,
  handleGetTopPurchases,
  handleGetTopSale,
  handleGetTopPoint,
  handleGetTopByType,
  handleGetTopByListType,
  handleFindProduct,
  handleTracking,
  handleTrackingWithoutData,
} from "../controllers/product.controller";
import { sanitizeRequestBody } from "../middleware/sanitize";

const router = new Hono();
router.use("*", sanitizeRequestBody);

router.post("/", validateCreateProduct, handleCreateProduct);

router.get("/search", validateSearch, validatePagination, handleFindProduct);

router.get("/top/purchases", validatePagination, handleGetTopPurchases);
router.get("/top/sale", validatePagination, handleGetTopSale);
router.get("/top/point", validatePagination, handleGetTopPoint);
router.get("/top/list-type", validatePagination, handleGetTopByListType);
router.get("/top/type/:type", validatePagination, handleGetTopByType);
router.post("/recommend", handleTrackingWithoutData);
router.post("/recommend/:userId", validatePagination, handleTracking);

router.get("/:productId", ProductById);

export default router;
