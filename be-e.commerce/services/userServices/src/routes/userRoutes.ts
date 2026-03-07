import {
  login,
  refreshToken,
  register,
  logout,
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
import { internalAuth } from "../middleware/internalAuth";
import { extractUser } from "../middleware/extractUser";

const userRoutes = new Hono();

userRoutes.use("/*", internalAuth);

userRoutes.post("/register", validateRegister, register);
userRoutes.post("/login", validateLogin, login);
userRoutes.post("/refresh-token", refreshToken);
userRoutes.get("/verify-email", verifyEmail);
userRoutes.post("/send-reset-password-email", sendVerifyPasswordEmail);
userRoutes.post("/verify-resetpassword", verifyingResetPassword);
userRoutes.post("/change-password", changePassword);

userRoutes.use("/logout", extractUser);
userRoutes.use("/profile", extractUser);
userRoutes.use("/profile/*", extractUser);

userRoutes.post("/logout", logout);
userRoutes.get("/profile", profile);
userRoutes.get("/profile/:id", getProfileById);
userRoutes.put("/profile", updateProfile);
userRoutes.delete("/profile", deleteAccount);

export default userRoutes;
