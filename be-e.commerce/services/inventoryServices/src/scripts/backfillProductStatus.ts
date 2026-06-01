import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { config } from "../config";

const main = async () => {
  await mongoose.connect(config.mongoUri);
  const res = await Product.updateMany(
    { status: { $exists: false } },
    { $set: { status: "approved" } },
  );
  console.log(
    "[backfill] matched:",
    res.matchedCount,
    "modified:",
    res.modifiedCount,
  );
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error("[backfill] error:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
