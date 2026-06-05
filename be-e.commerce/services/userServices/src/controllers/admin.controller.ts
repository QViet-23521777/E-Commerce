import {
  createAdmin,
  verifyAdmin,
  banUser,
  unbanUser,
  listUsers,
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

export const unbanUserController = async (c: Context) => {
  try {
    const { userId } = await c.req.json();
    const adminId = c.req.header("x-user-id");
    if (!adminId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
    await unbanUser(adminId, userId);
    return c.json(
      { success: true, message: "User reactivated successfully" },
      200,
    );
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const listUsersController = async (c: Context) => {
  try {
    const users = await listUsers();
    return c.json({ success: true, data: users }, 200);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
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

// Admin dashboard stats sourced from the user collection: total user count and a
// 6-month signup trend. Product/feedback counts live in their own services and
// are fetched separately by the dashboard.
export const getAdminStatsController = async (c: Context) => {
  try {
    const totalUsers = await User.countDocuments({});

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const rows = await User.aggregate<{ _id: { y: number; m: number }; count: number }>([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
    const counts = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r.count]));

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySignups: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlySignups.push({ month: MONTHS[d.getMonth()], value: counts.get(key) ?? 0 });
    }

    return c.json({ success: true, data: { totalUsers, monthlySignups } });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
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
