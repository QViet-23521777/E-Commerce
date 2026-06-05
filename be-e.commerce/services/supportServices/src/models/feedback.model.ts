import mongoose, { Schema, Document } from "mongoose";

// A single piece of user feedback / support request. Submitted by any
// authenticated user; triaged by admins (resolve / reopen / reply).
export interface IFeedback extends Document {
  userId?: string;
  author: string;
  email: string;
  subject: string;
  message: string;
  rating: number; // 0–5
  status: "open" | "resolved";
  urgent: boolean;
  reply?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: String, index: true },
    author: { type: String, default: "Anonymous" },
    email: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    urgent: { type: Boolean, default: false },
    reply: { type: String },
  },
  { timestamps: true },
);

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
