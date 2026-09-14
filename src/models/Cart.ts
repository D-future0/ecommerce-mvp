import { Schema, model, models, Types, Model } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  variant?: string;
  quantity: number;
}

export interface ICart {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

export const Cart: Model<ICart> = models.Cart || model<ICart>("Cart", CartSchema);
