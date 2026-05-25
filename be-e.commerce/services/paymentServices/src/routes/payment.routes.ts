import { Hono } from "hono";
import {
  createMomoPaymentController,
  getMomoPaymentMethodsController,
  getPaymentHistoryController,
  getPaymentStatusController,
  momoIpnController,
  refundPaymentController,
  syncPaymentController,
} from "../controllers/payment.controller";
import { extractUser } from "../middleware/extractUser";
import { internalAuth } from "../middleware/internalAuth";
import {
  validateCreateMomoPayment,
  validatePaymentHistory,
  validateRefundPayment,
} from "../middleware/validatePayment";

const paymentRoutes = new Hono();

paymentRoutes.get("/methods", internalAuth, getMomoPaymentMethodsController);
paymentRoutes.post(
  "/momo/create",
  internalAuth,
  extractUser,
  validateCreateMomoPayment,
  createMomoPaymentController,
);
paymentRoutes.post("/momo/ipn", internalAuth, momoIpnController);
paymentRoutes.get(
  "/history",
  internalAuth,
  extractUser,
  validatePaymentHistory,
  getPaymentHistoryController,
);
paymentRoutes.post("/:orderId/sync", internalAuth, extractUser, syncPaymentController);
paymentRoutes.post(
  "/:orderId/refund",
  internalAuth,
  extractUser,
  validateRefundPayment,
  refundPaymentController,
);
paymentRoutes.get("/:orderId", internalAuth, extractUser, getPaymentStatusController);

export default paymentRoutes;
