import { User } from "../models/userModel";
import { Role } from "../models/role.Model";
import { Permission } from "../models/user_permision.Model";

export const checkPermission = async (userId: string, action: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");
  const role = await Role.findById(user.roleId);
  if (!role) throw new Error("ROLE_NOT_FOUND");
  const permission = await Permission.findOne({ roleId: role._id, action });
  if (!permission) throw new Error("PERMISSION_NOT_FOUND");
  return !!permission;
};
