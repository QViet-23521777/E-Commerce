import { Feedback, IFeedback } from "../models/feedback.model";

export type FeedbackInput = {
  author?: string;
  email?: string;
  subject?: string;
  message?: string;
  rating?: number;
};

const view = (doc: any) => ({
  id: String(doc._id),
  author: doc.author,
  email: doc.email,
  subject: doc.subject,
  message: doc.message,
  rating: doc.rating ?? 0,
  status: doc.status,
  urgent: !!doc.urgent,
  reply: doc.reply ?? "",
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

/** Create a feedback entry. Urgent is derived from a low rating. */
export const createFeedback = async (userId: string | null, input: FeedbackInput) => {
  const subject = String(input.subject || "").trim();
  const message = String(input.message || "").trim();
  if (!subject || !message) return null;

  const rating = Math.max(0, Math.min(5, Math.floor(Number(input.rating) || 0)));
  const doc = await Feedback.create({
    userId: userId || undefined,
    author: String(input.author || "Anonymous").trim() || "Anonymous",
    email: String(input.email || "").trim(),
    subject,
    message,
    rating,
    status: "open",
    urgent: rating > 0 && rating <= 2,
  });
  return view(doc);
};

/** List feedback, newest first, optionally filtered by status. */
export const listFeedback = async (status?: string) => {
  const query: Record<string, unknown> = {};
  if (status === "open" || status === "resolved") query.status = status;
  const docs = await Feedback.find(query).sort({ createdAt: -1 }).lean();
  return docs.map(view);
};

/** Patch a feedback entry: resolve/reopen and/or set a reply. */
export const updateFeedback = async (
  id: string,
  patch: { status?: string; reply?: string },
) => {
  const set: Record<string, unknown> = {};
  if (patch.status === "open" || patch.status === "resolved") {
    set.status = patch.status;
  }
  if (typeof patch.reply === "string") set.reply = patch.reply.trim();
  if (Object.keys(set).length === 0) return null;

  const doc = await Feedback.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  return doc ? view(doc) : null;
};
