import { Context } from "hono";
import {
  createInventory,
  getInventoryBySellerId,
  updateInventoryQuantity,
  buyProduct,
  buyProductByList,
  checkInventory,
  deleteInventory,
  findInventoryById,
  findInventoriesByName,
  restoreInventory,
  restoreInventoryByList,
} from "../services/inventory.services";

export const handleCreateInventory = async (c: Context) => {
  try {
    const { name, productId, quantity, sellerId } = await c.req.json();
    if (!name || !productId || !quantity || !sellerId === undefined) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400,
      );
    }
    const inventory = await createInventory(
      sellerId,
      name,
      productId,
      quantity,
    );
    return c.json(inventory);
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleGetInventoryBySellerId = async (c: Context) => {
  try {
    const sellerId = c.req.param("sellerId")?.toString() || "";
    const inventories = await getInventoryBySellerId(sellerId);
    if (!inventories || inventories.length === 0) {
      return c.json({ success: false, message: "No inventory found" }, 404);
    }
    return c.json(inventories);
  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleUpdateInventoryQuantity = async (c: Context) => {
  try {
    const inventoryId = c.req.param("inventoryId")?.toString() || "";
    const { quantity } = await c.req.json();
    if (quantity === undefined) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400,
      );
    }
    const inventory = await updateInventoryQuantity(inventoryId, quantity);
    return c.json(inventory);
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleBuyProduct = async (c: Context) => {
  try {
    const inventoryId = c.req.param("inventoryId")?.toString() || "";
    const { quantity } = await c.req.json();
    if (quantity === undefined) {
      return c.json(
        { success: false, message: "Missing required fields" },
        400,
      );
    }
    const inventory = await buyProduct(inventoryId, quantity);
    return c.json(inventory);
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleGetInventoryById = async (c: Context) => {
  try {
    const inventoryId = c.req.param("inventoryId")?.toString() || "";
    const inventory = await findInventoryById(inventoryId);
    return c.json({ success: true, data: inventory }); // ✅
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleSearchInventoriesByName = async (c: Context) => {
  try {
    const name = c.req.query("name") || "";
    const inventories = await findInventoriesByName(name);
    return c.json(inventories);
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleDeleteInventory = async (c: Context) => {
  try {
    const inventoryId = c.req.param("inventoryId")?.toString() || "";
    await deleteInventory(inventoryId);
    return c.json({ success: true, message: "Inventory deleted successfully" });
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleBuyProductByList = async (c: Context) => {
  try {
    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json(
        { success: false, message: "items phải là một mảng không trống" },
        400,
      );
    }
    for (const item of items) {
      if (!item.inventoryId || item.quantity === undefined) {
        return c.json(
          {
            success: false,
            message: "Mỗi item phải có inventoryId và quantity",
          },
          400,
        );
      }
    }

    await checkInventory(items);
    const result = await buyProductByList(items);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (
      error.message.includes("Insufficient inventory") ||
      error.message.includes("Inventory not found")
    ) {
      return c.json({ success: false, message: error.message }, 400);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleCheckInventory = async (c: Context) => {
  try {
    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json(
        { success: false, message: "items phải là một mảng không trống" },
        400,
      );
    }
    for (const item of items) {
      if (!item.inventoryId || item.quantity === undefined) {
        return c.json(
          {
            success: false,
            message: "Mỗi item phải có inventoryId và quantity",
          },
          400,
        );
      }
    }

    await checkInventory(items);
    return c.json({ success: true, message: "Inventory đủ điều kiện" });
  } catch (error: any) {
    if (
      error.message.includes("Inventory not found") ||
      error.message.includes("Insufficient inventory")
    ) {
      return c.json({ success: false, message: error.message }, 400);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleRestoreInventory = async (c: Context) => {
  try {
    const inventoryId = c.req.param("inventoryId")?.toString() || "";
    const { quantity } = await c.req.json();
    if (quantity === undefined) {
      return c.json({ success: false, message: "quantity là bắt buộc" }, 400);
    }
    const inventory = await restoreInventory(inventoryId, quantity);
    return c.json({ success: true, data: inventory });
  } catch (error: any) {
    if (error.message === "Inventory not found") {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};

export const handleRestoreInventoryByList = async (c: Context) => {
  try {
    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json(
        { success: false, message: "items phải là một mảng không trống" },
        400,
      );
    }
    for (const item of items) {
      if (!item.inventoryId || item.quantity === undefined) {
        return c.json(
          {
            success: false,
            message: "Mỗi item phải có inventoryId và quantity",
          },
          400,
        );
      }
    }
    const result = await restoreInventoryByList(items);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message.includes("Inventory not found")) {
      return c.json({ success: false, message: error.message }, 404);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
};
