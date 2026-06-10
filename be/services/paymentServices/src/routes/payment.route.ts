import { Hono } from "hono";
import {
  advanceFulfillmentController,
  cancelOrderController,
  createMomoPaymentController,
  getPaymentStatusController,
  listMyOrdersController,
  listSellerOrdersController,
  momoIpnController,
  walletCheckoutController,
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

paymentRoutes.post(
  "/wallet/checkout",
  internalAuth,
  extractUser,
  validateCreateMomoPayment, // dùng lại validator vì cùng input shape
  walletCheckoutController,
);

// Specific paths must be registered BEFORE the "/:orderId" catch-all.
paymentRoutes.get("/", internalAuth, extractUser, listMyOrdersController);

paymentRoutes.get(
  "/seller",
  internalAuth,
  extractUser,
  listSellerOrdersController,
);

paymentRoutes.patch(
  "/:orderId/fulfillment",
  internalAuth,
  extractUser,
  advanceFulfillmentController,
);

paymentRoutes.post(
  "/:orderId/cancel",
  internalAuth,
  extractUser,
  cancelOrderController,
);

paymentRoutes.get(
  "/:orderId",
  internalAuth,
  extractUser,
  getPaymentStatusController,
);

export default paymentRoutes;
