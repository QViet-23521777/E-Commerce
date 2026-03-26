"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const validate_middleware_1 = require("../middleware/validate.middleware");
const product_controller_1 = require("../controllers/product.controller");
const router = new hono_1.Hono();
router.post("/", validate_middleware_1.validateCreateProduct, product_controller_1.handleCreateProduct);
router.get("/search", validate_middleware_1.validateSearch, validate_middleware_1.validatePagination, product_controller_1.handleFindProduct);
router.get("/top/purchases", validate_middleware_1.validatePagination, product_controller_1.handleGetTopPurchases);
router.get("/top/sale", validate_middleware_1.validatePagination, product_controller_1.handleGetTopSale);
router.get("/top/point", validate_middleware_1.validatePagination, product_controller_1.handleGetTopPoint);
router.get("/top/list-type", validate_middleware_1.validatePagination, product_controller_1.handleGetTopByListType);
router.get("/top/type/:type", validate_middleware_1.validatePagination, product_controller_1.handleGetTopByType);
router.get("/recommend", product_controller_1.handleTrackingWithoutData);
router.get("/recommend/:userId", validate_middleware_1.validatePagination, product_controller_1.handleTracking);
router.get("/:productId", product_controller_1.ProductById);
exports.default = router;
//# sourceMappingURL=product.route.js.map