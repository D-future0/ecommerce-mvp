import { Schema, model, models, Types, Model } from "mongoose";
import { Product } from "./Product";

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number; // 1-5
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

async function recalcProductRating(productId: Types.ObjectId) {
  const stats = await model("Review").aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = stats[0] ?? {};
  await Product.findByIdAndUpdate(productId, {
    ratingAverage: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
}

ReviewSchema.post("save", function (doc) {
  recalcProductRating(doc.product as Types.ObjectId).catch(console.error);
});

ReviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) recalcProductRating(doc.product as Types.ObjectId).catch(console.error);
});

export const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
