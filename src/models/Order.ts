import { Schema, model, models, Types, Model } from "mongoose";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface IOrderItem {
  product: Types.ObjectId;
  title: string; // snapshot at time of order
  image: string;
  variant?: string;
  price: number; // unit price at time of order
  quantity: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  paystackReference: string;
  paystackAuthorizationUrl?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    variant: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    shippingAddress: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paystackReference: { type: String, required: true, unique: true },
    paystackAuthorizationUrl: String,
    paidAt: Date,
  },
  { timestamps: true }
);

export const Order: Model<IOrder> = models.Order || model<IOrder>("Order", OrderSchema);
