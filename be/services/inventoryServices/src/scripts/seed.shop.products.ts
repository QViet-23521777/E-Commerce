/**
 * Seed ~20 products per shop (status=approved) into the inventory DB
 * (ecommerce_inventory) from the committed DummyJSON catalogue, and create an
 * Inventory listing linking each product to its owning shop.
 *
 * Reads the shop manifest produced by userServices `seedShops.ts`. Products may
 * repeat across shops (each shop gets its own product docs). Ratings + a few
 * sample reviews come from the dataset.
 *
 * Idempotent + non-destructive: before seeding it deletes ONLY the products and
 * inventory owned by the manifest's seed shops; real data is untouched.
 *
 * Run AFTER seedShops.ts (host, against dockerized Mongo on port 27018):
 *   cd be-e.commerce/services/inventoryServices
 *   MONGODB_URI="mongodb://127.0.0.1:27018/ecommerce_inventory" npx ts-node src/scripts/seedShopProducts.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Product } from "../models/product.model";
import Inventory from "../models/inventory.model";
import { config } from "../config";

const DATASETS_DIR = path.resolve(__dirname, "../../../../datasets");
const MANIFEST_PATH = path.join(DATASETS_DIR, "seeded-shops.json");
const DATASET_PATH = path.join(DATASETS_DIR, "dummyjson-products.json");

const USD_TO_VND = 25000;
const MIN_PER_SHOP = 18;
const MAX_PER_SHOP = 22;

type Shop = { sellerId: string; name: string; address: string; avatar: string };
type DatasetReview = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
};
type DatasetProduct = {
  title: string;
  description: string;
  price: number; // USD
  discountPercentage?: number;
  rating?: number;
  category?: string;
  thumbnail?: string;
  images?: string[];
  reviews?: DatasetReview[];
};

// DummyJSON category → the storefront's TYPE_OPTIONS.
const CATEGORY_MAP: Record<string, string> = {
  "kitchen-accessories": "Kitchenware",
  groceries: "Kitchenware",
  "home-decoration": "Decor",
  furniture: "Decor",
  laptops: "Electronics",
  smartphones: "Electronics",
  tablets: "Electronics",
  "mobile-accessories": "Electronics",
  "mens-watches": "Electronics",
  "womens-watches": "Electronics",
  "mens-shirts": "Fashion",
  tops: "Fashion",
  "womens-dresses": "Fashion",
  "mens-shoes": "Fashion",
  "womens-shoes": "Fashion",
  "womens-bags": "Fashion",
  sunglasses: "Fashion",
  "womens-jewellery": "Fashion",
  fragrances: "Fashion",
  beauty: "Fashion",
  "skin-care": "Fashion",
};
const mapType = (c?: string) => (c && CATEGORY_MAP[c]) || "Other";

// Deterministic RNG (mulberry32) so a given seed gives stable output.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = mulberry32(20260530);
const randInt = (min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function readJson<T>(p: string, label: string): T {
  if (!fs.existsSync(p)) {
    console.error(`[seedShopProducts] missing ${label}: ${p}`);
    if (label === "shop manifest")
      console.error("  → run userServices/src/scripts/seedShops.ts first.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

async function main() {
  const shops = readJson<Shop[]>(MANIFEST_PATH, "shop manifest");
  const dataset = readJson<DatasetProduct[]>(DATASET_PATH, "product dataset");
  if (!Array.isArray(shops) || shops.length === 0)
    throw new Error("Empty shop manifest");
  if (!Array.isArray(dataset) || dataset.length === 0)
    throw new Error("Empty product dataset");

  await mongoose.connect(config.mongoUri);
  console.log("[seedShopProducts] connected to", mongoose.connection.db?.databaseName);

  const sellerObjIds = shops.map((s) => new mongoose.Types.ObjectId(s.sellerId));

  // Scoped clean: remove only seed-shop-owned inventory + their products.
  const ownedInv = await Inventory.find(
    { sellerId: { $in: sellerObjIds } },
    { productId: 1 },
  );
  const ownedProductIds = ownedInv.map((d) => d.productId);
  const delInv = await Inventory.deleteMany({ sellerId: { $in: sellerObjIds } });
  const delProd = await Product.deleteMany({ _id: { $in: ownedProductIds } });
  console.log(
    `[seedShopProducts] cleaned ${delInv.deletedCount ?? 0} inventory, ${delProd.deletedCount ?? 0} products from prior seed`,
  );

  // Build product docs (with a parallel owner/quantity list to zip after insert).
  const productDocs: Record<string, unknown>[] = [];
  const owners: { sellerId: mongoose.Types.ObjectId; quantity: number; name: string }[] = [];

  for (let s = 0; s < shops.length; s++) {
    const sellerId = sellerObjIds[s];
    const count = randInt(MIN_PER_SHOP, MAX_PER_SHOP);
    for (let k = 0; k < count; k++) {
      const tpl = dataset[randInt(0, dataset.length - 1)];
      const jitter = 0.95 + rng() * 0.1; // ±5%
      const price = Math.max(1000, Math.round(tpl.price * USD_TO_VND * jitter));
      const reviews = (tpl.reviews ?? []).map((r) => ({
        author: r.reviewerName,
        rating: r.rating,
        text: r.comment,
        date: new Date(r.date),
      }));
      const name = tpl.title;

      productDocs.push({
        name,
        normalize: normalize(name),
        description: tpl.description,
        price,
        sale: Math.round(tpl.discountPercentage ?? 0),
        imageUrl: tpl.images?.length ? tpl.images : [tpl.thumbnail || ""],
        thumbnail: tpl.thumbnail || tpl.images?.[0] || "",
        type: mapType(tpl.category),
        point: randInt(0, 100),
        numPurchases: randInt(0, 5000),
        status: "approved",
        rating: tpl.rating ?? 0,
        numReviews: reviews.length,
        reviews,
      });
      owners.push({ sellerId, quantity: randInt(5, 200), name });
    }
  }

  const inserted = await Product.insertMany(productDocs, { ordered: false });
  console.log(`[seedShopProducts] inserted ${inserted.length} products`);

  const inventoryDocs = inserted.map((p, idx) => ({
    name: owners[idx].name,
    sellerId: owners[idx].sellerId,
    productId: p._id,
    quantity: owners[idx].quantity,
  }));
  const invResult = await Inventory.insertMany(inventoryDocs, { ordered: false });
  console.log(`[seedShopProducts] inserted ${invResult.length} inventory listings`);

  console.log(
    `[seedShopProducts] done — ${shops.length} shops, avg ${(inserted.length / shops.length).toFixed(1)} products/shop`,
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[seedShopProducts] error:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
