import { Context } from "hono";
import {
  createSellerAccount,
  verifySeller,
  getSellerProfile,
  updateSellerProfile,
  deleteSellerAccount,
} from "../services/seller.services";
import { mailClient } from "../utils/mailClient";
const HTTP_STATUS: Record<string, number> = {
  USER_NOT_FOUND: 404,
  USER_ALREADY_A_SELLER: 400,
  SELLER_ROLE_NOT_FOUND: 500,
  ADDRESS_REQUIRED: 400,
  PHONE_REQUIRED: 400,
  INVALID_OTP: 400,
  USER_PROFILE_NOT_FOUND: 404,
};

function handleError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = HTTP_STATUS[message] ?? 500;
  return c.json({ success: false, message }, status as any);
}

export const createSeller = async (c: Context) => {
  try {
    const { userId, address, phone } = await c.req.json();
    const { user, otp } = await createSellerAccount({ userId, address, phone });
    mailClient.sendSellerAccountVerificationEmail(
      user.email,
      otp,
      new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    );
    return c.json(
      {
        success: true,
        message:
          "Seller account created. Please verify your email to complete the process.",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const verifySellerAccount = async (c: Context) => {
  try {
    const { userId, otp } = await c.req.json();
    const userProfile = await verifySeller(userId, otp);
    return c.json(
      {
        success: true,
        message: "Seller account verified successfully",
        data: userProfile,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const getSeller = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const userProfile = await getSellerProfile(userId);
    return c.json(
      {
        success: true,
        message: "Seller profile retrieved successfully",
        data: userProfile,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const updateSeller = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const updates = await c.req.json();
    const updatedProfile = await updateSellerProfile(userId, updates);
    return c.json(
      {
        success: true,
        message: "Seller profile updated successfully",
        data: updatedProfile,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const deleteSeller = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const result = await deleteSellerAccount(userId);
    return c.json(
      {
        success: true,
        message: result.message,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};
