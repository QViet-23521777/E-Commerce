import mongoose from "mongoose";
export interface IRole extends mongoose.Document {
  name: "user" | "admin" | "seller" | "superadmin";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);
export const Role = mongoose.model<IRole>("Role", RoleSchema);
