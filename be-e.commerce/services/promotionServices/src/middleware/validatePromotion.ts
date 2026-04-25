import { Context, Next } from "hono";
import {
  CreatePromotionInput,
  PromotionCartItemInput,
  UpdatePromotionInput,
  ValidatePromotionInput,
} from "../services/promotion.service";

const isPositiveNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNonNegativeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const validateCartItems = (items: PromotionCartItemInput[], errors: string[]) => {
  items.forEach((item, index) => {
    if (!item.productId || item.productId.trim() === "") {
      errors.push(`items[${index}].productId is required`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`items[${index}].quantity must be a positive integer`);
    }
    if (!isNonNegativeNumber(item.unitPrice)) {
      errors.push(`items[${index}].unitPrice must be a non-negative number`);
    }
  });
};

const readJson = async <T>(c: Context): Promise<T> => {
  try {
    return (await c.req.json()) as T;
  } catch {
    return {} as T;
  }
};

export const validateCreatePromotion = async (c: Context, next: Next) => {
  const body = await readJson<CreatePromotionInput>(c);
  const errors: string[] = [];

  if (!body.code || body.code.trim() === "") {
    errors.push("code is required");
  }
  if (!body.title || body.title.trim() === "") {
    errors.push("title is required");
  }
  if (!["percentage", "fixed"].includes(body.discountType)) {
    errors.push("discountType must be either 'percentage' or 'fixed'");
  }
  if (!isPositiveNumber(body.discountValue)) {
    errors.push("discountValue must be a positive number");
  }
  if (
    body.discountType === "percentage" &&
    isPositiveNumber(body.discountValue) &&
    body.discountValue > 100
  ) {
    errors.push("percentage discountValue cannot exceed 100");
  }
  if (
    body.minOrderAmount !== undefined &&
    !isNonNegativeNumber(body.minOrderAmount)
  ) {
    errors.push("minOrderAmount must be a non-negative number");
  }
  if (
    body.maxDiscountAmount !== undefined &&
    body.maxDiscountAmount !== null &&
    !isPositiveNumber(body.maxDiscountAmount)
  ) {
    errors.push("maxDiscountAmount must be a positive number");
  }
  if (!body.startDate || Number.isNaN(Date.parse(body.startDate))) {
    errors.push("startDate must be a valid date");
  }
  if (!body.endDate || Number.isNaN(Date.parse(body.endDate))) {
    errors.push("endDate must be a valid date");
  }
  if (
    body.startDate &&
    body.endDate &&
    !Number.isNaN(Date.parse(body.startDate)) &&
    !Number.isNaN(Date.parse(body.endDate)) &&
    new Date(body.startDate) >= new Date(body.endDate)
  ) {
    errors.push("endDate must be after startDate");
  }
  if (
    body.usageLimit !== undefined &&
    body.usageLimit !== null &&
    (!Number.isInteger(body.usageLimit) || body.usageLimit <= 0)
  ) {
    errors.push("usageLimit must be a positive integer");
  }
  if (
    body.usageLimitPerUser !== undefined &&
    body.usageLimitPerUser !== null &&
    (!Number.isInteger(body.usageLimitPerUser) || body.usageLimitPerUser <= 0)
  ) {
    errors.push("usageLimitPerUser must be a positive integer");
  }
  if (body.productIds !== undefined && !isStringArray(body.productIds)) {
    errors.push("productIds must be an array of strings");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};

export const validateUpdatePromotion = async (c: Context, next: Next) => {
  const body = await readJson<UpdatePromotionInput>(c);
  const errors: string[] = [];

  if (body.code !== undefined && body.code.trim() === "") {
    errors.push("code must not be empty");
  }
  if (body.title !== undefined && body.title.trim() === "") {
    errors.push("title must not be empty");
  }
  if (
    body.discountType !== undefined &&
    !["percentage", "fixed"].includes(body.discountType)
  ) {
    errors.push("discountType must be either 'percentage' or 'fixed'");
  }
  if (body.discountValue !== undefined && !isPositiveNumber(body.discountValue)) {
    errors.push("discountValue must be a positive number");
  }
  if (
    body.discountType === "percentage" &&
    body.discountValue !== undefined &&
    isPositiveNumber(body.discountValue) &&
    body.discountValue > 100
  ) {
    errors.push("percentage discountValue cannot exceed 100");
  }
  if (
    body.minOrderAmount !== undefined &&
    !isNonNegativeNumber(body.minOrderAmount)
  ) {
    errors.push("minOrderAmount must be a non-negative number");
  }
  if (
    body.maxDiscountAmount !== undefined &&
    body.maxDiscountAmount !== null &&
    !isPositiveNumber(body.maxDiscountAmount)
  ) {
    errors.push("maxDiscountAmount must be a positive number");
  }
  if (body.startDate !== undefined && Number.isNaN(Date.parse(body.startDate))) {
    errors.push("startDate must be a valid date");
  }
  if (body.endDate !== undefined && Number.isNaN(Date.parse(body.endDate))) {
    errors.push("endDate must be a valid date");
  }
  if (
    body.usageLimit !== undefined &&
    body.usageLimit !== null &&
    (!Number.isInteger(body.usageLimit) || body.usageLimit <= 0)
  ) {
    errors.push("usageLimit must be a positive integer");
  }
  if (
    body.usageLimitPerUser !== undefined &&
    body.usageLimitPerUser !== null &&
    (!Number.isInteger(body.usageLimitPerUser) || body.usageLimitPerUser <= 0)
  ) {
    errors.push("usageLimitPerUser must be a positive integer");
  }
  if (body.productIds !== undefined && !isStringArray(body.productIds)) {
    errors.push("productIds must be an array of strings");
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};

export const validatePromotionCheck = async (c: Context, next: Next) => {
  const body = await readJson<ValidatePromotionInput>(c);
  const errors: string[] = [];

  if (!body.code || body.code.trim() === "") {
    errors.push("code is required");
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else {
    validateCartItems(body.items, errors);
  }

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};
