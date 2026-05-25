import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPaymentRefund {
  requestId: string;
  orderId: string;
  amount: number;
  description: string;
  resultCode?: number | null;
  message?: string | null;
  transId?: number | null;
  response?: Record<string, unknown>;
  createdAt: Date;
}

export interface IPayment extends Document {
  userId: string;
  partnerCode: string;
  requestId: string;
  orderId: string;
  amount: number;
  currency: string;
  requestType: string;
  paymentMethod: "wallet" | "atm" | "credit_card" | "momo_methods";
  orderInfo: string;
  status:
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded";
  redirectUrl: string;
  ipnUrl: string;
  extraData: string;
  items: IPaymentItem[];
  refundedAmount: number;
  payUrl?: string | null;
  deeplink?: string | null;
  qrCodeUrl?: string | null;
  transId?: number | null;
  resultCode?: number | null;
  message?: string | null;
  createPayload?: Record<string, unknown>;
  createResponse?: Record<string, unknown>;
  ipnPayload?: Record<string, unknown>;
  queryResponse?: Record<string, unknown>;
  refunds: IPaymentRefund[];
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

const PaymentRefundSchema = new Schema<IPaymentRefund>(
  {
    requestId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    resultCode: { type: Number, default: null },
    message: { type: String, default: null },
    transId: { type: Number, default: null },
    response: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
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
    paymentMethod: {
      type: String,
      enum: ["wallet", "atm", "credit_card", "momo_methods"],
      required: true,
      default: "wallet",
      index: true,
    },
    orderInfo: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
      index: true,
    },
    redirectUrl: { type: String, required: true },
    ipnUrl: { type: String, required: true },
    extraData: { type: String, default: "" },
    items: { type: [PaymentItemSchema], default: [] },
    refundedAmount: { type: Number, default: 0 },
    payUrl: { type: String, default: null },
    deeplink: { type: String, default: null },
    qrCodeUrl: { type: String, default: null },
    transId: { type: Number, default: null },
    resultCode: { type: Number, default: null },
    message: { type: String, default: null },
    createPayload: { type: Schema.Types.Mixed, default: null },
    createResponse: { type: Schema.Types.Mixed, default: null },
    ipnPayload: { type: Schema.Types.Mixed, default: null },
    queryResponse: { type: Schema.Types.Mixed, default: null },
    refunds: { type: [PaymentRefundSchema], default: [] },
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const PaymentModel =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
