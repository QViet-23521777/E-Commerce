import {
  createAdmin,
  verifyAdmin,
  banUser,
  adminLogin,
  adminSecondFactorAuth,
} from "../services/admin.services";
import { Context } from "hono";
import { mailClient } from "../utils/mailClient";
import { User } from "../models/userModel";

const ADMIN_HTTP_STATUS: Record<string, number> = {
  INVALID_CREDENTIALS: 401,
  NOT_AN_ADMIN: 403,
  USER_NOT_FOUND: 404,
  OTP_REQUIRED: 400,
  INVALID_OTP: 400,
};

function handleAdminError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = ADMIN_HTTP_STATUS[message] ?? 400;
  return c.json({ success: false, message }, status as any);
}

export const createAdminController = async (c: Context) => {
  try {
    const { name, email, superAdminId } = await c.req.json();
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.env?.remoteAddr ||
      "";
    const { adminInvite, token } = await createAdmin(
      name,
      email,
      ip,
      superAdminId,
    );
    console.log("Admin invite created:", adminInvite);
    const sendAdminInviteEmail =
      await mailClient.sendAdminAccountVerificationEmail(
        email,
        token,
        adminInvite.expiredAt?.toDateString() || "",
      );
    console.log("Admin invite email sent:", sendAdminInviteEmail);
    return c.json(
      { success: true, data: { adminInvite, token }, sendAdminInviteEmail },
      201,
    );
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const verifyAdminController = async (c: Context) => {
  try {
    const { email, token, password } = await c.req.json();
    const result = await verifyAdmin(email, token, password);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const banUserController = async (c: Context) => {
  try {
    const { userId } = await c.req.json();
    const adminId = c.req.header("x-user-id");
    if (!adminId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
    await banUser(adminId, userId);
    return c.json({ success: true, message: "User banned successfully" }, 200);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const adminLoginController = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    const { user, otp, twoFactorEnabled, tokens, role } = await adminLogin(
      email,
      password,
    );
    if (twoFactorEnabled && otp) {
      mailClient
        .sendLoginEmail(
          user.email,
          user.name,
          otp,
          new Date(Date.now() + 300000).toISOString(),
        )
        .catch(() => {});
    }
    return c.json(
      {
        success: true,
        message: twoFactorEnabled
          ? "OTP sent to admin email"
          : "Admin logged in successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role,
          twoFactorEnabled,
        },
        // Present only when 2FA is disabled — lets the client skip the OTP step.
        tokens: tokens ?? undefined,
      },
      200,
    );
  } catch (error) {
    return handleAdminError(c, error);
  }
};

export const adminSecondFactorAuthController = async (c: Context) => {
  try {
    const { userId, otp } = await c.req.json();
    const { user, tokens, role } = await adminSecondFactorAuth(userId, otp);
    return c.json(
      {
        success: true,
        message: "Admin 2FA successful",
        data: { id: user._id, name: user.name, email: user.email, role },
        tokens,
      },
      200,
    );
  } catch (error) {
    return handleAdminError(c, error);
  }
};
