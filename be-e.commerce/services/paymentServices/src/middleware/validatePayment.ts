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
  paymentMethod?: string;
  requestType?: string;
  items?: CreatePaymentItemInput[];
};

const PAYMENT_METHODS = ["wallet", "atm", "credit_card", "momo_methods"];
const REQUEST_TYPES = ["captureWallet", "payWithATM", "payWithCC", "payWithMethod"];
const STATUSES = ["pending", "paid", "failed", "refunded", "partially_refunded"];

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

  if (
    body.paymentMethod !== undefined &&
    !PAYMENT_METHODS.includes(body.paymentMethod)
  ) {
    errors.push(`paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`);
  }

  if (body.requestType !== undefined && !REQUEST_TYPES.includes(body.requestType)) {
    errors.push(`requestType must be one of: ${REQUEST_TYPES.join(", ")}`);
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

export const validatePaymentHistory = async (c: Context, next: Next) => {
  const status = c.req.query("status");
  const paymentMethod = c.req.query("paymentMethod");
  const page = c.req.query("page");
  const limit = c.req.query("limit");
  const errors: string[] = [];

  if (status && !STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}`);
  }

  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}`);
  }

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
    errors.push("page must be a positive integer");
  }

  if (
    limit !== undefined &&
    (!Number.isInteger(Number(limit)) || Number(limit) <= 0 || Number(limit) > 100)
  ) {
    errors.push("limit must be a positive integer up to 100");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  await next();
};

export const validateRefundPayment = async (c: Context, next: Next) => {
  const body = (await c.req.json()) as {
    amount?: number;
    description?: string;
    lang?: string;
  };
  const errors: string[] = [];

  if (
    body.amount !== undefined &&
    (!Number.isFinite(body.amount) || Number(body.amount) <= 0)
  ) {
    errors.push("amount must be a positive number");
  }

  if (body.description !== undefined && body.description.trim() === "") {
    errors.push("description must not be empty");
  }

  if (body.lang !== undefined && !["vi", "en"].includes(body.lang)) {
    errors.push("lang must be either 'vi' or 'en'");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};
