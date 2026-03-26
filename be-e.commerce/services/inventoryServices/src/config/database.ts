import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { config } from "./index";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);

    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    const rawCount = await db.collection("product").countDocuments();
    const modelCollection = Product.collection.name;
    const modelCount = await Product.estimatedDocumentCount();

    console.log("[mongo] connected");
    console.log("[mongo] uri:", config.mongoUri);
    console.log("[mongo] db:", db.databaseName);
    console.log("[mongo] host:", mongoose.connection.host);
    console.log("[mongo] raw product count:", rawCount);
    console.log("[mongo] mongoose collection:", modelCollection);
    console.log("[mongo] mongoose product count:", modelCount);

    const sample = await db
      .collection("product")
      .find({}, { projection: { name: 1, price: 1, sale: 1, type: 1 } })
      .limit(3)
      .toArray();
    console.log("[mongo] sample:", sample);

    if (rawCount === 0) {
      console.warn(
        "[mongo] product collection is empty. If you're running via Docker, don't use 'localhost' inside the app container. Use mongodb://mongo:27017/ecommerce_inventory (mongo service) or mongodb://host.docker.internal:27017/ecommerce_inventory (host Mongo).",
      );
    }
  } catch (error) {
    console.error("[mongo] connection error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("[mongo] disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("[mongo] error:", err);
});

mongoose.connection.on("connected", () => {
  console.log(
    "[mongo] connected to:",
    mongoose.connection.host,
    mongoose.connection.db?.databaseName,
  );
});
