import { User } from "../models/userModel";
import { Role } from "../models/role.Model";
import crypto from "crypto";
import { AdminInvite } from "../models/admin.invite.model";
import bcrypt from "bcrypt";
import { JwtService } from "../utils/jwtService";
export const createAdmin = async (
  name: string,
  email: string,
  ip: string,
  superAdminId: string,
) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already exists");
  }
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const role = await Role.findOne({ name: "admin" });
  if (!role) {
    throw new Error("Admin role not found");
  }
  const adminInvite = await AdminInvite.create({
    name,
    email,
    token: hashedToken,
    status: "pending",
    createdBy: superAdminId,
    expiredAt,
    ipCreatedBy: ip,
  });
  return { adminInvite, token };
};

export const verifyAdmin = async (
  email: string,
  token: string,
  password: string,
) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await AdminInvite.findOne({ email, token: hashedToken });
  if (!invite) throw new Error("Invalid token or email");

  if (invite.status !== "pending")
    throw new Error("Invite already used or expired");

  if (invite.expiredAt && invite.expiredAt < new Date()) {
    invite.status = "expired";
    await invite.save();
    throw new Error("Invite has expired");
  }

  const role = await Role.findOne({ name: "admin" });
  if (!role) throw new Error("Admin role not found");
  if (!password) throw new Error("Password is required");

  const user = await User.create({
    name: invite.name,
    email: invite.email,
    password: await bcrypt.hash(password, 10),
    roleId: role._id,
    ip: invite.ipCreatedBy ?? "",
  });

  invite.status = "approved";
  invite.approvedAt = new Date();
  await invite.save();

  return { user };
};

export const adminLogin = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }
  const tokens = await JwtService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: "admin",
  });
  user.refreshToken = tokens.refreshToken;
  await user.save();
  return { user, tokens };
};

export const banUser = async (adminId: string, userId: string) => {
  const [admin, user, adminRole, superadminRole] = await Promise.all([
    User.findById(adminId),
    User.findById(userId),
    Role.findOne({ name: "admin" }),
    Role.findOne({ name: "superadmin" }),
  ]);

  if (!admin) throw new Error("Admin not found");
  if (!user) throw new Error("User not found");

  const adminRoleId = adminRole?._id.toString();
  const superadminRoleId = superadminRole?._id.toString();
  const callerRoleId = admin.roleId.toString();
  const targetRoleId = user.roleId.toString();

  if (callerRoleId !== adminRoleId && callerRoleId !== superadminRoleId) {
    throw new Error("Only admins can ban users");
  }

  if (targetRoleId === adminRoleId || targetRoleId === superadminRoleId) {
    throw new Error("Cannot ban an admin or superadmin");
  }

  user.isActive = false;
  await user.save();
  return user;
};
