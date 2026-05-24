import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import { config } from "../config";

type SeedOptions = {
  file: string;
  drop: boolean;
};

const parseArgs = (): SeedOptions => {
  const args = process.argv.slice(2);

  const fileFlagIndex = args.findIndex((a) => a === "--file" || a === "-f");
  const file =
    fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : args[0] ?? "";
  const drop = args.includes("--drop");

  if (!file) {
    console.error(
      "Usage: ts-node src/scripts/seedProducts.ts --file <products_mongo.json> [--drop]",
    );
    process.exit(1);
  }

  return { file, drop };
};

const toDate = (value: unknown) => {
  if (!value) return undefined;
  const dt = new Date(String(value));
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

const main = async () => {
  const { file, drop } = parseArgs();
  const fullPath = path.resolve(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.error("[seed] file not found:", fullPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error("[seed] JSON must be an array");
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB not connected");

  console.log("[seed] uri:", config.mongoUri);
  console.log("[seed] db:", db.databaseName);
  console.log("[seed] collection:", Product.collection.name);

  const before = await Product.estimatedDocumentCount();
  console.log("[seed] before count:", before);

  if (drop) {
    await Product.deleteMany({});
    console.log("[seed] dropped existing documents");
  }

  const docs = data
    .filter((p) => p && typeof p === "object")
    .map((p: any) => ({
      ...p,
      createdAt: toDate(p.createdAt) ?? new Date(),
      updatedAt: toDate(p.updatedAt) ?? new Date(),
    }));

  const result = await Product.insertMany(docs, { ordered: false });
  console.log("[seed] inserted:", result.length);

  const after = await Product.estimatedDocumentCount();
  console.log("[seed] after count:", after);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error("[seed] error:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

