import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sellerId?: string;
  image?: string;
  catalogProductId?: string;
}

export type FulfillmentStatus =
  | "to_confirm"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IShippingAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  city?: string;
  zip?: string;
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
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress?: IShippingAddress;
  shippingMethod?: string;
  trackingNo?: string | null;
  cancelledAt?: Date | null;
  refundedAt?: Date | null;
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
  inventoryDeducted?: boolean;
  walletCredited?: boolean;
  inventoryRestored?: boolean;
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
    sellerId: { type: String, default: null },
    image: { type: String, default: null },
    catalogProductId: { type: String, default: null },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    zip: { type: String, default: "" },
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
    fulfillmentStatus: {
      type: String,
      enum: ["to_confirm", "processing", "shipped", "delivered", "cancelled"],
      default: "to_confirm",
      index: true,
    },
    shippingAddress: { type: ShippingAddressSchema, default: null },
    shippingMethod: { type: String, default: null },
    trackingNo: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
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
    inventoryDeducted: { type: Boolean, default: false },
    walletCredited: { type: Boolean, default: false },
    inventoryRestored: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ "items.sellerId": 1, createdAt: -1 });

export const PaymentModel =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
