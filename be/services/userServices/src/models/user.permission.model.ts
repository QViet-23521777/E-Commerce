import mongoose from "mongoose";
export interface Permission extends mongoose.Document {
  roleId: mongoose.Types.ObjectId;
  actionCode: string[];
  actionName: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    actionCode: { type: [String], required: true, trim: true },
    actionName: { type: [String], required: true, trim: true },
  },
  {
    timestamps: true,
  },
);
export const Permission = mongoose.model<Permission>(
  "Permission",
  PermissionSchema,
);
