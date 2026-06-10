import { Context } from "hono";
import {
  registerUser,
  loginUser,
  verifyUserEmail,
  refreshUserToken,
  logoutUser,
  getUserProfile,
  getUserProfileById,
  updateUserProfile,
  deleteUserAccount,
  setRessetPasswordToken,
  verifyResetPassword,
  resetPassword,
  changePasswordByUserId,
  getUserByToken,
  getUserByEmail,
  SecondFactorAuth,
} from "../services/user.service";
import { JwtService } from "../utils/jwt.service";
import { mailClient } from "../utils/mail.client";

const HTTP_STATUS: Record<string, number> = {
  EMAIL_EXISTS: 400,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 401,
  USER_NOT_FOUND: 404,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 400,
  INVALID_OTP: 400,
  OTP_REQUIRED: 400,
  OLD_PASSWORD_INCORRECT: 400,
  PASSWORD_SAME_AS_OLD: 400,
  NEW_PASSWORD_REQUIRED: 400,
};

function handleError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = HTTP_STATUS[message] ?? 500;
  return c.json({ success: false, message }, status as any);
}

export const register = async (c: Context) => {
  try {
    const { name, email, password } = await c.req.json();
    const { user, tokens, Token } = await registerUser({
      name,
      email,
      password,
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${Token!}`;
    mailClient
      .sendVerifyEmail(user.email, user.name, verifyUrl)
      .catch(() => {});

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
      201,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const verifyEmail = async (c: Context) => {
  try {
    const token = c.req.query("token");
    if (!token)
      return c.json({ success: false, message: "Token is required" }, 400);

    await verifyUserEmail(token);

    return c.json(
      { success: true, message: "Email verified successfully" },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const login = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    const { user, tokens, otp, twoFactorEnabled } = await loginUser({
      email,
      password,
    });
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
        message: "User logged in successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          twoFactorEnabled,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const secondFactorAuth = async (c: Context) => {
  try {
    const { userId, otp } = await c.req.json();
    const { user, tokens } = await SecondFactorAuth(userId, otp);
    return c.json(
      {
        success: true,
        message: "2FA authentication successful",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const refreshToken = async (c: Context) => {
  try {
    const { refreshToken } = await c.req.json();
    if (!refreshToken) {
      return c.json(
        { success: false, message: "Refresh token is required" },
        400,
      );
    }

    const { accessToken } = await refreshUserToken(refreshToken);

    return c.json(
      {
        success: true,
        message: "Token refreshed successfully",
        data: { accessToken },
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const logout = async (c: Context) => {
  try {
    const user = c.get("user") as any;
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);

    await logoutUser(user.id);

    return c.json({ success: true, message: "Logout successful" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};

export const profile = async (c: Context) => {
  try {
    const user = c.get("user") as any;
    if (!user)
      return c.json({ success: false, message: "User not authenticated" }, 401);

    const userData = await getUserProfile(user.id);

    return c.json(
      {
        success: true,
        data: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          twoFactorEnabled: userData.twoFactorEnabled !== false,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const getProfileById = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const userData = await getUserProfileById(id);

    return c.json(
      {
        success: true,
        data: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const updateProfile = async (c: Context) => {
  try {
    const user = c.get("user") as any;
    if (!user)
      return c.json({ success: false, message: "User not authenticated" }, 401);

    const { name, walletId, twoFactorEnabled } = await c.req.json();
    const userData = await updateUserProfile(user.id, {
      name,
      walletId,
      twoFactorEnabled,
    });

    return c.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          twoFactorEnabled: userData.twoFactorEnabled !== false,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const deleteAccount = async (c: Context) => {
  try {
    const user = c.get("user") as any;
    if (!user)
      return c.json({ success: false, message: "User not authenticated" }, 401);

    await deleteUserAccount(user.id);

    return c.json(
      { success: true, message: "Account deleted successfully" },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const sendVerifyPasswordEmail = async (c: Context) => {
  try {
    const { email } = await c.req.json();
    if (!email)
      return c.json({ success: false, message: "Email is required" }, 400);

    const user = await getUserByEmail(email);
    if (!user)
      return c.json({ success: false, message: "User not found" }, 404);

    const { token, otp } = await setRessetPasswordToken(user.email);

    await mailClient.sendResetPassword(
      user.email,
      user.name,
      token,
      otp,
      new Date(Date.now() + 3600000).toISOString(),
    );

    return c.json(
      { success: true, message: "Reset password email sent", token },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
};

export const verifyingResetPassword = async (c: Context) => {
  try {
    const token = c.req.query("token");
    const { otp } = await c.req.json();

    if (!token)
      return c.json({ success: false, message: "Token is required" }, 400);
    if (!otp)
      return c.json({ success: false, message: "OTP is required" }, 400);

    await verifyResetPassword(token, otp);

    return c.json({ success: true, message: "Token is valid" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};

export const changePassword = async (c: Context) => {
  try {
    const { token, newPassword, oldPassword } = await c.req.json();

    if (!token)
      return c.json({ success: false, message: "Token is required" }, 400);
    if (!newPassword)
      return c.json(
        { success: false, message: "New password is required" },
        400,
      );

    // Try reset-token flow first (token stored in DB). Old password not required
    // here because the user proved ownership of the account by verifying the OTP
    // that was emailed to them.
    const byResetToken = await getUserByToken(token).catch(() => null);
    if (byResetToken) {
      await resetPassword(token, newPassword, oldPassword);
      return c.json(
        { success: true, message: "Complete change password." },
        200,
      );
    }

    // Fall back to JWT access-token flow (logged-in user changing their own password).
    // Here oldPassword is required to defend against a stolen-session takeover.
    if (!oldPassword)
      return c.json(
        { success: false, message: "Old password is required" },
        400,
      );

    let userId: string;
    try {
      const decoded = JwtService.verifyAccessToken(token) as { userId: string };
      userId = decoded.userId;
    } catch {
      return c.json({ success: false, message: "USER_NOT_FOUND" }, 404);
    }

    await changePasswordByUserId(userId, oldPassword, newPassword);
    return c.json({ success: true, message: "Complete change password." }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};
