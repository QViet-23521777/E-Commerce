import { Context } from "hono";
import {
  advanceFulfillment,
  cancelOrder,
  checkoutWithWallet,
  createMomoPaymentSession,
  getPaymentForUser,
  listOrdersForBuyer,
  listOrdersForSeller,
  processMomoIpn,
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
      items?: Array<{ inventoryId: string; quantity: number }>;
      walletId?: string;
    };
    const payment = await createMomoPaymentSession(user.id, body);

    return c.json({ success: true, data: payment }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payment";
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

export const walletCheckoutController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const body = c.get("validatedBody") as {
      amount?: number;
      orderInfo?: string;
      items?: Array<{ inventoryId: string; quantity: number }>;
    };
    const payment = await checkoutWithWallet(user.id, body);

    return c.json({ success: true, data: payment }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to checkout";
    const status = message === "Insufficient balance" ? 402 : 400;
    return c.json({ success: false, message }, status);
  }
};

export const getPaymentStatusController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) {
      return c.json({ success: false, message: "orderId is required" }, 400);
    }
    const payment = await getPaymentForUser(orderId, user.id);

    return c.json({ success: true, data: payment });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get payment";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};

export const listMyOrdersController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const status = c.req.query("status") || undefined;
    const limit = c.req.query("limit");
    const orders = await listOrdersForBuyer(user.id, {
      status,
      limit: limit ? Number(limit) : undefined,
    });

    return c.json({ success: true, data: orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list orders";
    return c.json({ success: false, message }, 400);
  }
};

export const listSellerOrdersController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const status = c.req.query("status") || undefined;
    const orders = await listOrdersForSeller(user.id, { status });

    return c.json({ success: true, data: orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list seller orders";
    return c.json({ success: false, message }, 400);
  }
};

export const advanceFulfillmentController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) {
      return c.json({ success: false, message: "orderId is required" }, 400);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: "confirm" | "ship" | "deliver";
      trackingNo?: string;
    };

    if (!body.action) {
      return c.json({ success: false, message: "action is required" }, 400);
    }

    const order = await advanceFulfillment(
      orderId,
      user.id,
      body.action,
      body.trackingNo,
    );

    return c.json({ success: true, data: order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};

export const cancelOrderController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
    if (!orderId) {
      return c.json({ success: false, message: "orderId is required" }, 400);
    }
    const order = await cancelOrder(orderId, user.id);

    return c.json({ success: true, data: order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel order";
    const status = message === "Payment not found" ? 404 : 400;
    return c.json({ success: false, message }, status);
  }
};
