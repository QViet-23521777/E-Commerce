import { Hono } from "hono";
import { extractUser } from "../middleware/extractUser";
import { internalAuth } from "../middleware/internalAuth";
import { validateCreditWallet } from "../middleware/validatePayment";
import {
  creditMyWalletController,
  getMyWalletController,
} from "../controllers/wallet.controller";

const walletRouter = new Hono();

walletRouter.get("/me", internalAuth, extractUser, getMyWalletController);
walletRouter.post(
  "/me/credit",
  internalAuth,
  extractUser,
  validateCreditWallet,
  creditMyWalletController,
);

export default walletRouter;

