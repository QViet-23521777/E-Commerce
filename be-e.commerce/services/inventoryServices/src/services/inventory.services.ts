import Inventory from "../models/inventory.model";

export const createInventory = async (
  sellerId: string,
  name: string,
  productId: string,
  quantity: number,
) => {
  const normalize = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const inventoryData = {
    name: normalize,
    sellerId: sellerId,
    productId: productId,
    quantity: quantity,
  };
  const inventory = new Inventory(inventoryData);
  await inventory.save();
  return inventory;
};

export const getInventoryBySellerId = async (sellerId: string) => {
  const products = await Inventory.find({ sellerId: sellerId }).populate(
    "productId",
  );
  return products;
};

export const updateInventoryQuantity = async (
  inventoryId: string,
  quantity: number,
) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }
  inventory.quantity = quantity;
  await inventory.save();
  return inventory;
};

export const buyProduct = async (inventoryId: string, quantity: number) => {
  const inventory = await Inventory.findOneAndUpdate(
    { _id: inventoryId, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true },
  );

  if (!inventory) {
    throw new Error("Insufficient inventory or Inventory not found");
  }

  return inventory;
};

export const buyProductByList = async (
  items: { inventoryId: string; quantity: number }[],
) => {
  const results = [];

  for (const item of items) {
    const inventory = await Inventory.findOneAndUpdate(
      { _id: item.inventoryId, quantity: { $gte: item.quantity } },
      { $inc: { quantity: -item.quantity } },
      { new: true },
    );

    if (!inventory) {
      const purchased = results.map((r) => ({
        inventoryId: r._id.toString(),
        quantity: items.find((i) => i.inventoryId === r._id.toString())!
          .quantity,
      }));
      await restoreInventoryByList(purchased);

      throw new Error(
        `Insufficient inventory or not found for ${item.inventoryId}`,
      );
    }

    results.push(inventory);
  }

  return results;
};

export const restoreInventoryByList = async (
  items: { inventoryId: string; quantity: number }[],
) => {
  const results = [];

  for (const item of items) {
    const inventory = await Inventory.findByIdAndUpdate(
      item.inventoryId,
      { $inc: { quantity: item.quantity } },
      { new: true },
    );

    if (!inventory) {
      throw new Error(`Inventory not found for ${item.inventoryId}`);
    }

    results.push(inventory);
  }

  return results;
};

export const restoreInventory = async (
  inventoryId: string,
  quantity: number,
) => {
  const inventory = await Inventory.findByIdAndUpdate(
    inventoryId,
    { $inc: { quantity: quantity } },
    { new: true },
  );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
};

export const findInventoryById = async (inventoryId: string) => {
  const inventory = await Inventory.findById(inventoryId).populate(
    "productId",
    "price name",
  );
  if (!inventory) {
    throw new Error("Inventory not found");
  }
  return inventory;
};

export const findInventoriesByName = async (name: string) => {
  const inventories = await Inventory.find({
    name: { $regex: name, $options: "i" },
  });
  if (!inventories.length) {
    throw new Error("Inventory not found");
  }
  return inventories;
};

export const checkInventory = async (
  items: { inventoryId: string; quantity: number }[],
) => {
  for (const item of items) {
    const inventory = await Inventory.findById(item.inventoryId);
    if (!inventory) {
      throw new Error(`Inventory not found for ${item.inventoryId}`);
    }
    if (inventory.quantity < item.quantity) {
      throw new Error(`Insufficient inventory for ${inventory.name}`);
    }
  }
  return true;
};

export const deleteInventory = async (inventoryId: string) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }
  await Inventory.findByIdAndDelete(inventoryId);
  return inventory;
};
