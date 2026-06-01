import {
  IPromotion,
  IPromotionRedemption,
  PromotionModel,
} from "../models/promotion.model";

export type CreatePromotionInput = {
  code: string;
  title: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  active?: boolean;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  productIds?: string[];
};

export type UpdatePromotionInput = Partial<CreatePromotionInput>;

export type PromotionCartItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type ValidatePromotionInput = {
  code: string;
  items: PromotionCartItemInput[];
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const normalizePromotion = (promotion: IPromotion) => ({
  id: promotion._id.toString(),
  code: promotion.code,
  title: promotion.title,
  description: promotion.description,
  discountType: promotion.discountType,
  discountValue: promotion.discountValue,
  minOrderAmount: promotion.minOrderAmount,
  maxDiscountAmount: promotion.maxDiscountAmount,
  startDate: promotion.startDate,
  endDate: promotion.endDate,
  active: promotion.active,
  usageLimit: promotion.usageLimit,
  usedCount: promotion.usedCount,
  usageLimitPerUser: promotion.usageLimitPerUser,
  productIds: promotion.productIds,
  createdAt: promotion.createdAt,
  updatedAt: promotion.updatedAt,
});

const getUserRedemptionCount = (promotion: IPromotion, userId: string) => {
  const redemption = promotion.redemptions.find(
    (item: IPromotionRedemption) => item.userId === userId,
  );
  return redemption?.count ?? 0;
};

const getEligibleSubtotal = (
  promotion: IPromotion,
  items: PromotionCartItemInput[],
) => {
  const allowedProducts = new Set(promotion.productIds);
  const eligibleItems =
    promotion.productIds.length === 0
      ? items
      : items.filter((item) => allowedProducts.has(item.productId));

  return eligibleItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
};

const getOrderSubtotal = (items: PromotionCartItemInput[]) =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

const calculateDiscount = (promotion: IPromotion, eligibleSubtotal: number) => {
  if (eligibleSubtotal <= 0) return 0;

  const rawDiscount =
    promotion.discountType === "percentage"
      ? (eligibleSubtotal * promotion.discountValue) / 100
      : promotion.discountValue;

  const cappedDiscount =
    promotion.maxDiscountAmount !== null &&
    promotion.maxDiscountAmount !== undefined
      ? Math.min(rawDiscount, promotion.maxDiscountAmount)
      : rawDiscount;

  return Math.min(Math.round(cappedDiscount), eligibleSubtotal);
};

const ensurePromotionUsable = (
  promotion: IPromotion,
  items: PromotionCartItemInput[],
  userId?: string,
) => {
  const now = new Date();
  const orderSubtotal = getOrderSubtotal(items);
  const eligibleSubtotal = getEligibleSubtotal(promotion, items);

  if (!promotion.active) {
    throw new Error("Promotion is inactive");
  }
  if (promotion.startDate > now) {
    throw new Error("Promotion has not started");
  }
  if (promotion.endDate < now) {
    throw new Error("Promotion has expired");
  }
  if (orderSubtotal < promotion.minOrderAmount) {
    throw new Error(
      `Order subtotal must be at least ${promotion.minOrderAmount}`,
    );
  }
  if (eligibleSubtotal <= 0) {
    throw new Error("Promotion is not applicable to these items");
  }
  if (
    promotion.usageLimit !== null &&
    promotion.usageLimit !== undefined &&
    promotion.usedCount >= promotion.usageLimit
  ) {
    throw new Error("Promotion usage limit reached");
  }
  if (
    userId &&
    promotion.usageLimitPerUser !== null &&
    promotion.usageLimitPerUser !== undefined &&
    getUserRedemptionCount(promotion, userId) >= promotion.usageLimitPerUser
  ) {
    throw new Error("Promotion usage limit reached for this user");
  }

  const discountAmount = calculateDiscount(promotion, eligibleSubtotal);

  return {
    orderSubtotal,
    eligibleSubtotal,
    discountAmount,
    finalAmount: Math.max(orderSubtotal - discountAmount, 0),
  };
};

export const createPromotion = async (payload: CreatePromotionInput) => {
  const promotion = await PromotionModel.create({
    code: normalizeCode(payload.code),
    title: payload.title.trim(),
    description: payload.description?.trim() || "",
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    minOrderAmount: payload.minOrderAmount ?? 0,
    maxDiscountAmount: payload.maxDiscountAmount ?? null,
    startDate: new Date(payload.startDate),
    endDate: new Date(payload.endDate),
    active: payload.active ?? true,
    usageLimit: payload.usageLimit ?? null,
    usageLimitPerUser: payload.usageLimitPerUser ?? null,
    productIds: payload.productIds ?? [],
  });

  return normalizePromotion(promotion);
};

export const listPromotions = async (query: {
  active?: boolean;
  limit?: number;
  page?: number;
}) => {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const filter = query.active === undefined ? {} : { active: query.active };

  const [items, total] = await Promise.all([
    PromotionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PromotionModel.countDocuments(filter),
  ]);

  return {
    items: items.map(normalizePromotion),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const listActivePromotions = async () => {
  const now = new Date();
  const promotions = await PromotionModel.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    ],
  }).sort({ endDate: 1 });

  return promotions.map(normalizePromotion);
};

export const getPromotionById = async (promotionId: string) => {
  const promotion = await PromotionModel.findById(promotionId);
  if (!promotion) throw new Error("Promotion not found");

  return normalizePromotion(promotion);
};

export const getPromotionByCode = async (code: string) => {
  const promotion = await PromotionModel.findOne({ code: normalizeCode(code) });
  if (!promotion) throw new Error("Promotion not found");

  return normalizePromotion(promotion);
};

export const updatePromotion = async (
  promotionId: string,
  payload: UpdatePromotionInput,
) => {
  const existingPromotion = await PromotionModel.findById(promotionId);
  if (!existingPromotion) throw new Error("Promotion not found");

  const nextDiscountType =
    payload.discountType ?? existingPromotion.discountType;
  const nextDiscountValue =
    payload.discountValue ?? existingPromotion.discountValue;
  const nextStartDate =
    payload.startDate !== undefined
      ? new Date(payload.startDate)
      : existingPromotion.startDate;
  const nextEndDate =
    payload.endDate !== undefined ? new Date(payload.endDate) : existingPromotion.endDate;

  if (nextDiscountType === "percentage" && nextDiscountValue > 100) {
    throw new Error("percentage discountValue cannot exceed 100");
  }
  if (nextStartDate >= nextEndDate) {
    throw new Error("endDate must be after startDate");
  }

  const update: Record<string, unknown> = { ...payload };

  if (payload.code !== undefined) update.code = normalizeCode(payload.code);
  if (payload.title !== undefined) update.title = payload.title.trim();
  if (payload.description !== undefined) {
    update.description = payload.description.trim();
  }
  if (payload.startDate !== undefined) update.startDate = new Date(payload.startDate);
  if (payload.endDate !== undefined) update.endDate = new Date(payload.endDate);
  if (payload.maxDiscountAmount === undefined) delete update.maxDiscountAmount;
  if (payload.usageLimit === undefined) delete update.usageLimit;
  if (payload.usageLimitPerUser === undefined) delete update.usageLimitPerUser;

  const promotion = await PromotionModel.findByIdAndUpdate(promotionId, update, {
    new: true,
    runValidators: true,
  });

  if (!promotion) throw new Error("Promotion not found");

  return normalizePromotion(promotion);
};

export const deletePromotion = async (promotionId: string) => {
  const promotion = await PromotionModel.findByIdAndDelete(promotionId);
  if (!promotion) throw new Error("Promotion not found");

  return normalizePromotion(promotion);
};

export const validatePromotion = async (
  userId: string,
  payload: ValidatePromotionInput,
) => {
  const promotion = await PromotionModel.findOne({
    code: normalizeCode(payload.code),
  });

  if (!promotion) throw new Error("Promotion not found");

  const pricing = ensurePromotionUsable(promotion, payload.items, userId);

  return {
    promotion: normalizePromotion(promotion),
    ...pricing,
  };
};

export const redeemPromotion = async (
  userId: string,
  payload: ValidatePromotionInput,
) => {
  const promotion = await PromotionModel.findOne({
    code: normalizeCode(payload.code),
  });

  if (!promotion) throw new Error("Promotion not found");

  const pricing = ensurePromotionUsable(promotion, payload.items, userId);
  const redemption = promotion.redemptions.find(
    (item: IPromotionRedemption) => item.userId === userId,
  );

  promotion.usedCount += 1;

  if (redemption) {
    redemption.count += 1;
    redemption.lastRedeemedAt = new Date();
  } else {
    promotion.redemptions.push({
      userId,
      count: 1,
      lastRedeemedAt: new Date(),
    });
  }

  await promotion.save();

  return {
    promotion: normalizePromotion(promotion),
    ...pricing,
  };
};
