import { Hono } from "hono";
import { extractUser } from "../middleware/extractUser";
import { internalAuth } from "../middleware/internalAuth";
import {
  validateCreditWallet,
  validateRedeemPoints,
} from "../middleware/validatePayment";
import {
  adminCreditWalletController,
  creditMyWalletController,
  getMyPointsController,
  getMyWalletController,
  redeemPointsController,
  withdrawMyWalletController,
} from "../controllers/wallet.controller";

const walletRouter = new Hono();

walletRouter.get("/me", internalAuth, extractUser, getMyWalletController);

// Loyalty points: read summary + history, and redeem points for wallet credit.
walletRouter.get(
  "/me/points",
  internalAuth,
  extractUser,
  getMyPointsController,
);
walletRouter.post(
  "/me/points/redeem",
  internalAuth,
  extractUser,
  validateRedeemPoints,
  redeemPointsController,
);
walletRouter.post(
  "/me/credit",
  internalAuth,
  extractUser,
  validateCreditWallet,
  creditMyWalletController,
);
walletRouter.post(
  "/me/withdraw",
  internalAuth,
  extractUser,
  validateCreditWallet,
  withdrawMyWalletController,
);

// Admin top-up of another user's wallet. No extractUser — the target is taken
// from the body (userId). The admin role is enforced upstream at the gateway.
walletRouter.post(
  "/admin/credit",
  internalAuth,
  validateCreditWallet,
  adminCreditWalletController,
);

export default walletRouter;

