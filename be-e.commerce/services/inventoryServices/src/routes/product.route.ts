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
} from "../controllers/product.controller";

const router = new Hono();

router.post("/", validateCreateProduct, handleCreateProduct);

router.get("/search", validateSearch, validatePagination, handleFindProduct);

router.get("/top/purchases", validatePagination, handleGetTopPurchases);
router.get("/top/sale", validatePagination, handleGetTopSale);
router.get("/top/point", validatePagination, handleGetTopPoint);
router.get("/top/list-type", validatePagination, handleGetTopByListType);
router.get("/top/type/:type", validatePagination, handleGetTopByType);

router.get("/:productId", ProductById);

export default router;
