import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPayment extends Document {
  userId: string;
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  currency: string;
  requestType: string;
  orderInfo: string;
  status: "pending" | "paid" | "failed";
  redirectUrl: string;
  ipnUrl: string;
  extraData: string;
  items: IPaymentItem[];
  payUrl?: string | null;
  deeplink?: string | null;
  qrCodeUrl?: string | null;
  transId?: number | null;
  resultCode?: number | null;
  message?: string | null;
  createPayload?: Record<string, unknown>;
  createResponse?: Record<string, unknown>;
  ipnPayload?: Record<string, unknown>;
  paidAt?: Date | null;
  failedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentItemSchema = new Schema<IPaymentItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, index: true },
    partnerCode: { type: String, required: true },
    requestId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "VND" },
    requestType: { type: String, required: true, default: "captureWallet" },
    orderInfo: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    redirectUrl: { type: String, required: true },
    ipnUrl: { type: String, required: true },
    extraData: { type: String, default: "" },
    items: { type: [PaymentItemSchema], default: [] },
    payUrl: { type: String, default: null },
    deeplink: { type: String, default: null },
    qrCodeUrl: { type: String, default: null },
    transId: { type: Number, default: null },
    resultCode: { type: Number, default: null },
    message: { type: String, default: null },
    createPayload: { type: Schema.Types.Mixed, default: null },
    createResponse: { type: Schema.Types.Mixed, default: null },
    ipnPayload: { type: Schema.Types.Mixed, default: null },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.index({ userId: 1, createdAt: -1 });

export const PaymentModel =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
