import { Hono } from "hono";
import {
  createAdminController,
  verifyAdminController,
  banUserController,
  unbanUserController,
  listUsersController,
  adminLoginController,
  adminSecondFactorAuthController,
  getAdminStatsController,
} from "../controllers/admin.controller";

const adminRoutes = new Hono();

adminRoutes.get("/stats", getAdminStatsController);
adminRoutes.get("/users", listUsersController);

adminRoutes.post("/create", createAdminController);
adminRoutes.post("/verify", verifyAdminController);
adminRoutes.post("/ban-user", banUserController);
adminRoutes.post("/unban-user", unbanUserController);
adminRoutes.post("/login", adminLoginController);
adminRoutes.post("/second-factor-auth", adminSecondFactorAuthController);

export default adminRoutes;
