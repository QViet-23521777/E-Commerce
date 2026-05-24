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
  getUserByToken,
  getUserByEmail,
  SecondFactorAuth,
} from "../services/userServices";
import { mailClient } from "../utils/mailClient";

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
    const { user, tokens, Token } = await registerUser({
      name,
      email,
      password,
    });

    const verifyUrl = `${"http://localhost:3000"}/api/users/verify-email?token=${Token!}`;
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
    const { user, otp } = await loginUser({ email, password });
    console.log("Login thành công, chuẩn bị gửi email OTP...", user.name);
    const otpEmailSent = await mailClient.sendLoginEmail(
      user.email,
      user.name,
      otp,
      new Date(Date.now() + 300000).toISOString(),
    );
    console.log("Email OTP đã được gửi:", otpEmailSent);
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
    if (!oldPassword)
      return c.json(
        { success: false, message: "Old password is required" },
        400,
      );

    const user = await getUserByToken(token);
    if (!user)
      return c.json({ success: false, message: "User not found" }, 404);

    await resetPassword(token, newPassword, oldPassword);

    return c.json({ success: true, message: "Complete change password." }, 200);
  } catch (error) {
    return handleError(c, error);
  }
};
