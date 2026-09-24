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
import { internalAuth } from "../middleware/internalAuth";
import { extractUser } from "../middleware/extractUser";
import { requireAdmin } from "../middleware/requireAdmin";

const adminRoutes = new Hono();

// Nothing on this router may be reached except through the gateway.
adminRoutes.use("/*", internalAuth);

// Privileged operations. createAdmin() never validates its superAdminId
// argument — it only stores it as createdBy — so this gate is the only
// privilege check on admin invite creation.
adminRoutes.use("/create", extractUser, requireAdmin);
adminRoutes.use("/ban-user", extractUser, requireAdmin);
adminRoutes.use("/unban-user", extractUser, requireAdmin);
adminRoutes.use("/users", extractUser, requireAdmin);
adminRoutes.use("/stats", extractUser, requireAdmin);

// Pre-auth by design: the caller has no identity yet.
adminRoutes.post("/login", adminLoginController);
adminRoutes.post("/second-factor-auth", adminSecondFactorAuthController);
adminRoutes.post("/verify", verifyAdminController);

adminRoutes.get("/stats", getAdminStatsController);
adminRoutes.get("/users", listUsersController);
adminRoutes.post("/create", createAdminController);
adminRoutes.post("/ban-user", banUserController);
adminRoutes.post("/unban-user", unbanUserController);

export default adminRoutes;
