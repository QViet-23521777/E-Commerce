import { sanitizeRequestBody } from "./../middleware/sanitize";
import { Hono } from "hono";
import {
  handleCreateInventory,
  handleGetInventoryBySellerId,
  handleBuyProduct,
  handleBuyProductByList,
  handleCheckInventory,
  handleUpdateInventoryQuantity,
  handleDeleteInventory,
  handleGetInventoryById,
  handleSearchInventoriesByName,
  handleRestoreInventory,
  handleRestoreInventoryByList,
} from "../controllers/inventory.controller";
import { validateCreateInventory } from "../middleware/validate.middleware";

const router = new Hono();
router.use("*", sanitizeRequestBody);

router.post("/", validateCreateInventory, handleCreateInventory);
router.get("/seller/:sellerId", handleGetInventoryBySellerId);
router.get("/search", handleSearchInventoriesByName);
router.get("/:inventoryId", handleGetInventoryById);
router.put("/:inventoryId/quantity", handleUpdateInventoryQuantity);
router.post("/:inventoryId/buy", handleBuyProduct);
router.post("/buy/batch", handleBuyProductByList);
router.post("/check", handleCheckInventory);
router.post("/:inventoryId/restore", handleRestoreInventory);
router.post("/restore/batch", handleRestoreInventoryByList);
router.delete("/:inventoryId", handleDeleteInventory);

export default router;
