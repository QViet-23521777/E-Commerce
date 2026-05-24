import mongoose from "mongoose";

const adminInviteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "expired"],
      default: "pending",
    },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User" },
    ipCreatedBy: { type: String },
    expiredAt: { type: Date },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

export const AdminInvite = mongoose.model("AdminInvite", adminInviteSchema);
