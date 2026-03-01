import { User } from "./../models/userModel";
import { Context } from "hono";
import { JwtService } from "../utils/jwtService";
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
  getUserByToken,
  getUserByEmail,
} from "../services/userServices";
import crypto from "crypto";
import { mailClient } from "../utils/mailClient";
import { set } from "mongoose";

const HTTP_STATUS: Record<string, number> = {
  EMAIL_EXISTS: 400,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 401,
  USER_NOT_FOUND: 404,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 400,
};

function handleError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : "SERVER_ERROR";
  const status = HTTP_STATUS[message] ?? 500;
  return c.json({ success: false, message }, status as any);
}

export const register = async (c: Context) => {
  try {
    const { name, email, password } = await c.req.json();
    const { user, tokens } = await registerUser({ name, email, password });
    const verifyUrl = `${process.env.APP_URL || "http://localhost:3001"}/api/users/verify-email?token=${user.Token!}`;
    mailClient.sendVerifyEmail(user.email, user.name, verifyUrl);
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
    const { user, tokens } = await loginUser({ email, password });

    return c.json(
      {
        success: true,
        message: "User logged in successfully",
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
    const { userId } = await c.req.json();
    if (!userId) {
      return c.json({ success: false, message: "User ID is required" }, 400);
    }

    await logoutUser(userId);

    return c.json({ success: true, message: "Logout successful" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};

export const verifyToken = async (c: Context) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, message: "No token provided" }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = JwtService.verifyAccessToken(token);

    return c.json(
      {
        success: true,
        data: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        },
      },
      200,
    );
  } catch (error) {
    return c.json({ success: false, message: "Invalid or expired token" }, 401);
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
          walletId: userData.walletId,
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
          walletId: userData.walletId,
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

    const { name, walletId } = await c.req.json();
    const userData = await updateUserProfile(user.id, { name, walletId });

    return c.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          walletId: userData.walletId,
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
      return c.json({ success: false, message: "Email is required" }, 404);
    const user = await getUserByEmail(email);
    if (!user)
      return c.json({ success: false, message: "User not found" }, 404);
    const resetToken = setRessetPasswordToken(user.email).toString();
    const resetUrl = `${process.env.APP_URL || "http://localhost:3001"}/api/users/verify-resetpassword?token=${resetToken}`;
    mailClient.sendResetPassword(
      user.email,
      user.name,
      resetToken,
      resetUrl,
      new Date(Date.now() + 3600000).toISOString(),
    );
    return c.json({ success: true, message: "Reset password email sent" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};

export const verifyingResetPassword = async (c: Context) => {
  try {
    const token = c.req.query("token");
    const otp = await c.req.json();
    if (!token)
      return c.json({ success: false, message: "Token is required" }, 400);
    await verifyResetPassword(token, otp);
    return c.json({ success: true, message: "Token is valid" }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};

export const changePassword = async (c: Context) => {
  try {
    const user = await getUserByToken("token");
    if (!user) {
      return c.json({ success: false, message: "User not found" });
    }
    const { token, newpassword } = await c.req.json();
    await resetPassword(token, newpassword);
    return c.json({ success: true, message: "Complete change password." }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};
