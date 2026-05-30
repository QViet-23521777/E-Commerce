import { Hono } from "hono";
import {
  createAdminController,
  verifyAdminController,
  banUserController,
  adminLoginController,
  adminSecondFactorAuthController,
} from "../controllers/admin.controller";

const adminRoutes = new Hono();

adminRoutes.post("/create", createAdminController);
adminRoutes.post("/verify", verifyAdminController);
adminRoutes.post("/ban-user", banUserController);
adminRoutes.post("/login", adminLoginController);
adminRoutes.post("/second-factor-auth", adminSecondFactorAuthController);

export default adminRoutes;
