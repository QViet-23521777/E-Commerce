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
  secondFactorAuth,
  getWishlistController,
  addWishlistController,
  removeWishlistController,
  getAddressesController,
  replaceAddressesController,
} from "../controllers/user.controller";
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
userRoutes.post("/second-factor-auth", secondFactorAuth);

userRoutes.use("/logout", extractUser);
userRoutes.use("/profile", extractUser);
userRoutes.use("/profile/*", extractUser);
userRoutes.use("/wishlist", extractUser);
userRoutes.use("/wishlist/*", extractUser);
userRoutes.use("/addresses", extractUser);

userRoutes.post("/logout", logout);
userRoutes.get("/profile", profile);
userRoutes.get("/profile/:id", getProfileById);
userRoutes.put("/profile", updateProfile);
userRoutes.delete("/profile", deleteAccount);

userRoutes.get("/wishlist", getWishlistController);
userRoutes.post("/wishlist", addWishlistController);
userRoutes.delete("/wishlist/:productId", removeWishlistController);

userRoutes.get("/addresses", getAddressesController);
userRoutes.put("/addresses", replaceAddressesController);

export default userRoutes;
