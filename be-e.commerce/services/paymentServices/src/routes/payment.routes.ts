import { Hono } from "hono";
import {
  createMomoPaymentController,
  getPaymentStatusController,
  momoIpnController,
} from "../controllers/payment.controller";
import { extractUser } from "../middleware/extractUser";
import { internalAuth } from "../middleware/internalAuth";
import { validateCreateMomoPayment } from "../middleware/validatePayment";

const paymentRoutes = new Hono();

paymentRoutes.post(
  "/momo/create",
  internalAuth,
  extractUser,
  validateCreateMomoPayment,
  createMomoPaymentController,
);
paymentRoutes.post("/momo/ipn", internalAuth, momoIpnController);
paymentRoutes.get("/:orderId", internalAuth, extractUser, getPaymentStatusController);

export default paymentRoutes;
