import {
  createAdmin,
  verifyAdmin,
  banUser,
  adminLogin,
} from "../services/admin.services";
import { Context } from "hono";
import { mailClient } from "../utils/mailClient";
import { User } from "../models/userModel";

export const createAdminController = async (c: Context) => {
  try {
    const { name, email, superAdminId } = await c.req.json();
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.env?.remoteAddr ||
      "";
    if (!superAdminId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }
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
    const result = await adminLogin(email, password);
    return c.json({ success: true, data: result }, 200);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};
