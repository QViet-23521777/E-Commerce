import mongoose, { Schema, Document } from "mongoose";

export type SenderRole = "buyer" | "shop";

export interface IConversation extends Document {
  buyerId: string;
  shopId: string;
  buyerName: string;
  shopName: string;
  shopAvatar?: string;
  lastMessage: string;
  lastSenderRole: SenderRole;
  lastMessageAt: Date;
  unreadBuyer: number;
  unreadShop: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    buyerId: { type: String, required: true, index: true },
    shopId: { type: String, required: true, index: true },
    buyerName: { type: String, default: "Customer" },
    shopName: { type: String, default: "Shop" },
    shopAvatar: { type: String, default: "" },
    lastMessage: { type: String, default: "" },
    lastSenderRole: { type: String, enum: ["buyer", "shop"], default: "buyer" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadBuyer: { type: Number, default: 0 },
    unreadShop: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One conversation per buyer<->shop pair.
ConversationSchema.index({ buyerId: 1, shopId: 1 }, { unique: true });
ConversationSchema.index({ shopId: 1, lastMessageAt: -1 });
ConversationSchema.index({ buyerId: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
