import { Context } from "hono";
import {
  createMomoPaymentSession,
  getMomoPaymentMethods,
  getPaymentHistoryForUser,
  getPaymentForUser,
  processMomoIpn,
  refundPaymentForUser,
  syncPaymentWithMomo,
} from "../services/payment.service";

export const createMomoPaymentController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const body = c.get("validatedBody") as {
      amount?: number;
      orderInfo?: string;
      redirectUrl?: string;
      extraData?: string;
      lang?: string;
      paymentMethod?: "wallet" | "atm" | "credit_card" | "momo_methods";
      requestType?: "captureWallet" | "payWithATM" | "payWithCC" | "payWithMethod";
      items?: Array<{ productId: string; quantity: number }>;
    };
    const payment = await createMomoPaymentSession(user.id, body);

    return c.json(
      {
        success: true,
        data: payment,
      },
      201,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payment";
    return c.json({ success: false, message }, 400);
  }
};

export const getMomoPaymentMethodsController = async (c: Context) => {
  return c.json({
    success: true,
    data: getMomoPaymentMethods(),
  });
};

export const getPaymentHistoryController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const history = await getPaymentHistoryForUser(user.id, {
      page: Number(c.req.query("page")) || 1,
      limit: Number(c.req.query("limit")) || 20,
      status: c.req.query("status"),
      paymentMethod: c.req.query("paymentMethod"),
    });

    return c.json({
      success: true,
      data: history,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get payment history";
    return c.json({ success: false, message }, 400);
  }
};

export const momoIpnController = async (c: Context) => {
  try {
    const body = await c.req.json();
    await processMomoIpn(body);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process IPN";
    return c.json({ success: false, message }, 400);
  }
};

export const syncPaymentController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) return c.json({ success: false, message: "orderId is required" }, 400);

    const payment = await syncPaymentWithMomo(orderId, user.id);

    return c.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync payment";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};

export const refundPaymentController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) return c.json({ success: false, message: "orderId is required" }, 400);

    const body = c.get("validatedBody") as {
      amount?: number;
      description?: string;
      lang?: string;
    };
    const payment = await refundPaymentForUser(orderId, user.id, body);

    return c.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refund payment";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};

export const getPaymentStatusController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) return c.json({ success: false, message: "orderId is required" }, 400);

    const payment = await getPaymentForUser(orderId, user.id);

    return c.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get payment";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};
