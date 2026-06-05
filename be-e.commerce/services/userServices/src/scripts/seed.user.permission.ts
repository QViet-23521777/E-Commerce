import mongoose from "mongoose";
import { Permission } from "../models/user_permision.Model";
import { Role } from "../models/role.Model";

const seed = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27018/ecommerce_users",
    );
    console.log("Connected to MongoDB");

    await Permission.deleteMany({});
    console.log("Cleared old permissions");

    const roles = await Role.find({});
    const sellerRole = roles.find((r) => r.name === "seller");
    const adminRole = roles.find((r) => r.name === "admin");

    if (!sellerRole || !adminRole) {
      throw new Error("Roles not found — hãy chạy seed roles trước!");
    }

    await Permission.insertMany([
      {
        roleId: sellerRole._id,
        actionCode: [
          "payment:refund",
          "product:bulk_import",
          "product:manage",
          "product:create",
          "product:update",
          "product:delete",
        ],
        actionName: [
          "Hoàn tiền",
          "Import hàng loạt",
          "Quản lý sản phẩm",
          "Tạo sản phẩm",
          "Cập nhật sản phẩm",
          "Xoá sản phẩm",
        ],
      },
      {
        roleId: adminRole._id,
        actionCode: ["report:financial", "user:ban"],
        actionName: ["Xem báo cáo tài chính", "Khoá tài khoản"],
      },
    ]);
    console.log("Permissions created!");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
    process.exit(0);
  }
};

seed();
