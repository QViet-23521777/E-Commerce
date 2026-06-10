import mongoose, { Schema, Document, Types } from "mongoose";
import { SenderRole } from "./conversation.model";

export interface IProductRef {
  productId: string;
  name: string;
  image?: string;
  price?: number;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderRole: SenderRole;
  senderId: string;
  text: string;
  productRef?: IProductRef;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductRefSchema = new Schema<IProductRef>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
  },
  { _id: false },
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderRole: { type: String, enum: ["buyer", "shop"], required: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true },
    productRef: { type: ProductRefSchema, default: undefined },
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, _id: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
