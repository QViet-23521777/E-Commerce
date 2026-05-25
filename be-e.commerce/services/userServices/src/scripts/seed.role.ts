import mongoose from "mongoose";
import { Role } from "../models/role.Model";

const seed = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27018/ecommerce_users",
    );
    console.log("Connected to MongoDB");

    await Role.deleteMany({});
    console.log("Cleared old data");

    const roles = await Role.insertMany([
      { name: "user", description: "Người mua hàng" },
      { name: "seller", description: "Người bán hàng" },
      { name: "admin", description: "Quản trị viên" },
      { name: "superadmin", description: "Siêu quản trị viên" },
    ]);
    console.log(
      "Roles created:",
      roles.map((r) => r.name),
    );

    const sellerRole = roles.find((r) => r.name === "seller");
    const adminRole = roles.find((r) => r.name === "admin");
    const superadminRole = roles.find((r) => r.name === "superadmin");

    console.log("Seed done!");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
    process.exit(0);
  }
};

seed();
