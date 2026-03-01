import {
  login,
  refreshToken,
  register,
  logout,
  verifyToken,
  verifyEmail,
  profile,
  deleteAccount,
  updateProfile,
  getProfileById,
  sendVerifyPasswordEmail,
  changePassword,
  verifyingResetPassword,
} from "../controllers/userController";
import { Hono } from "hono";
import { validateRegister, validateLogin } from "../middleware/validateRequest";
import { authenticate } from "../middleware/authMiddleware";

const userRoutes = new Hono();

userRoutes.post("/register", validateRegister, register);
userRoutes.post("/login", validateLogin, login);
userRoutes.post("/refresh-token", refreshToken);
userRoutes.post("/logout", logout);
userRoutes.get("/verify-token", verifyToken);
userRoutes.get("/verify-email", verifyEmail);
userRoutes.post(
  "/send-reset-password-email",
  authenticate,
  sendVerifyPasswordEmail,
);
userRoutes.get("/verify-resetpassword", verifyingResetPassword);
userRoutes.post("/forgot-password", authenticate, changePassword);

userRoutes.use("/profile", authenticate);
userRoutes.use("/profile/*", authenticate);
userRoutes.get("/profile", profile);
userRoutes.get("/profile/:id", getProfileById);
userRoutes.put("/profile", updateProfile);
userRoutes.delete("/profile", deleteAccount);

export default userRoutes;
