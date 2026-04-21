import { Context, Next } from "hono";

type CreatePaymentItemInput = {
  productId: string;
  quantity: number;
};

type CreatePaymentInput = {
  amount?: number;
  orderInfo?: string;
  redirectUrl?: string;
  extraData?: string;
  lang?: string;
  items?: CreatePaymentItemInput[];
};

export const validateCreateMomoPayment = async (c: Context, next: Next) => {
  const body = (await c.req.json()) as CreatePaymentInput;
  const errors: string[] = [];

  if (
    body.amount !== undefined &&
    (!Number.isFinite(body.amount) || Number(body.amount) <= 0)
  ) {
    errors.push("amount must be a positive number");
  }

  if (body.orderInfo !== undefined && body.orderInfo.trim() === "") {
    errors.push("orderInfo must not be empty");
  }

  if (body.redirectUrl !== undefined && body.redirectUrl.trim() === "") {
    errors.push("redirectUrl must not be empty");
  }

  if (body.lang !== undefined && !["vi", "en"].includes(body.lang)) {
    errors.push("lang must be either 'vi' or 'en'");
  }

  if (body.items !== undefined) {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      errors.push("items must be a non-empty array when provided");
    } else {
      body.items.forEach((item, index) => {
        if (!item.productId || item.productId.trim() === "") {
          errors.push(`items[${index}].productId is required`);
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          errors.push(`items[${index}].quantity must be a positive integer`);
        }
      });
    }
  }

  if (body.amount === undefined && (!body.items || body.items.length === 0)) {
    errors.push("Either amount or items is required");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};
