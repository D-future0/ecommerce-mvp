import { Schema, model, models, Types, Model } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  mobile?: string;
  role: "customer" | "admin";
  wishlist: Types.ObjectId[];
  recentlyViewed: { product: Types.ObjectId; viewedAt: Date }[];
  addresses: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }[];
  billingAddress?: {
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  isDeactivated?: boolean;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "Nigeria" },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: "" },
    mobile: { type: String, default: "" },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    recentlyViewed: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    addresses: [AddressSchema],
    billingAddress: {
      label: { type: String, default: "Billing" },
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      phone: String,
    },
    isDeactivated: { type: Boolean, default: false },
    deactivatedAt: Date,
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
