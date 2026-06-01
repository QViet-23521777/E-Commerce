/**
 * Seed 50 demo "shop" seller accounts into the users DB (ecommerce_users) and
 * emit a manifest the inventory seed reads to attach products to each shop.
 *
 * Idempotent: upserts users by their deterministic `shopNN@seed.shop` email and
 * upserts a matching UserProfile, so re-running never duplicates. Real accounts
 * are untouched.
 *
 * Run (host, against dockerized Mongo on port 27018):
 *   cd be-e.commerce/services/userServices
 *   MONGODB_URI="mongodb://127.0.0.1:27018/ecommerce_users" npx ts-node src/scripts/seedShops.ts
 */
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import argon2 from "argon2";
import { User } from "../models/userModel";
import { Role } from "../models/role.Model";
import { UserProfile } from "../models/userProfile.Model";

const SHOP_COUNT = 50;
const SEED_PASSWORD = "Seed1234!";
const DATASETS_DIR = path.resolve(__dirname, "../../../../datasets");
const MANIFEST_PATH = path.join(DATASETS_DIR, "seeded-shops.json");

// Deterministic name/address building blocks (index-driven, so re-runs are stable).
const ADJECTIVES = [
  "Nordic", "Golden", "Urban", "Coastal", "Velvet", "Copper", "Maple", "Crimson",
  "Azure", "Ivory", "Stone", "Amber", "Cedar", "Frost", "Harbor", "Lunar",
  "Sage", "Onyx", "Willow", "Cobalt", "Ember", "Birch", "Slate", "Pearl", "Aspen",
];
const NOUNS = [
  "Market", "Emporium", "Trading Co.", "Bazaar", "Goods", "Mercantile", "Supply",
  "Collective", "Boutique", "Depot", "Outfitters", "Workshop", "Warehouse", "Stores",
];
const STREETS = [
  "Le Loi", "Nguyen Hue", "Tran Hung Dao", "Hai Ba Trung", "Dong Khoi", "Pasteur",
  "Vo Van Tan", "Cach Mang Thang 8", "Ly Tu Trong", "Nam Ky Khoi Nghia",
];
const CITIES = [
  "District 1, Ho Chi Minh City", "Hoan Kiem, Hanoi", "Hai Chau, Da Nang",
  "Ninh Kieu, Can Tho", "Le Chan, Hai Phong",
];

const pad = (n: number) => String(n).padStart(2, "0");

const shopName = (i: number) =>
  `${ADJECTIVES[i % ADJECTIVES.length]} ${NOUNS[(i * 3) % NOUNS.length]}`;

const shopAddress = (i: number) =>
  `${10 + ((i * 7) % 240)} ${STREETS[i % STREETS.length]}, ${CITIES[i % CITIES.length]}`;

const shopPhone = (i: number) => `09${pad((i * 13) % 100)}${String(1000000 + i * 7919).slice(-7)}`;

async function ensureSellerRole(): Promise<mongoose.Types.ObjectId> {
  let role = await Role.findOne({ name: "seller" });
  if (!role) {
    role = await Role.create({ name: "seller", description: "Shop owner / seller" });
    console.log("[seedShops] created missing 'seller' role");
  }
  return role._id as mongoose.Types.ObjectId;
}

async function main() {
  const uri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce_users";
  console.log("[seedShops] connecting:", uri);
  await mongoose.connect(uri);
  console.log("[seedShops] connected to", mongoose.connection.db?.databaseName);

  const sellerRoleId = await ensureSellerRole();
  // Hash with argon2 — the login path (userServices.ts :: loginUser) verifies
  // with argon2.verify, so a bcrypt hash here would reject every login.
  const passwordHash = await argon2.hash(SEED_PASSWORD);

  const manifest: {
    sellerId: string;
    name: string;
    address: string;
    avatar: string;
  }[] = [];

  for (let i = 0; i < SHOP_COUNT; i++) {
    const email = `shop${pad(i + 1)}@seed.shop`;
    const name = shopName(i);
    const address = shopAddress(i);
    const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
    const phone = shopPhone(i);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          roleId: sellerRoleId,
          isActive: true,
          isVerified: true,
          twoFactorEnabled: false,
        },
        // Only set the password on insert so re-runs don't churn the hash.
        $setOnInsert: { email, password: passwordHash },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: { address, avatar, phone } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    manifest.push({ sellerId: user._id.toString(), name, address, avatar });
  }

  if (!fs.existsSync(DATASETS_DIR)) fs.mkdirSync(DATASETS_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(
    `[seedShops] upserted ${manifest.length} shops → manifest at ${MANIFEST_PATH}`,
  );
  console.log(`[seedShops] login: shop01@seed.shop … shop${SHOP_COUNT}@seed.shop / ${SEED_PASSWORD}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("[seedShops] error:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
