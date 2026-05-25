import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
console.log("ENV check:", {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  MONGODB_URI: process.env.MONGODB_URI,
});
import { User } from "../models/userModel";
import { Role } from "../models/role.Model";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
const seedSuperAdmin = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect("mongodb://localhost:27018/ecommerce_users");
    console.log("Connected to MongoDB");

    const role = await Role.findOne({ name: "superadmin" });
    if (!role) throw new Error("Superadmin role not found");

    const existing = await User.findOne({
      email: "hoangquocviet123457@gmail.com",
    });
    if (existing) {
      console.log("Superadmin already exists");
      return;
    }
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error("ADMIN_PASSWORD is not set in .env");
    await User.create({
      name: "Super Admin",
      email: "hoangquocviet123457@gmail.com",
      password: await bcrypt.hash(adminPassword, 10),
      roleId: role._id,
      isActive: true,
      isVerified: true,
    });

    console.log("Superadmin created!");
  } catch (err) {
    console.error("Error:", err);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seedSuperAdmin();
