import { Context } from "hono";
import {
  createMomoPaymentSession,
  getPaymentForUser,
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

export const getPaymentStatusController = async (c: Context) => {
  try {
    const user = c.get("user") as { id: string };
    const orderId = c.req.param("orderId");
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
