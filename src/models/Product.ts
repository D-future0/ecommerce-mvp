import { Schema, model, models, Types, Model } from "mongoose";

export interface IProductVariant {
  name: string; // e.g. "Size"
  value: string; // e.g. "M"
  priceDelta?: number;
  stock: number;
  sku: string;
}

export interface IProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  price: number; // base price, in kobo/cents (smallest currency unit)
  compareAtPrice?: number;
  currency: string;
  images: string[];
  category: Types.ObjectId;
  tags: string[];
  attributes: Record<string, string>; // dynamic filterable attrs, e.g. { color: "black", material: "leather" }
  variants: IProductVariant[];
  stock: number; // total stock if no variants
  sku?: string;
  featured: boolean;
  isActive: boolean;
  relatedProducts: Types.ObjectId[];
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    priceDelta: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    currency: { type: String, default: "NGN" },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    tags: [{ type: String, index: true }],
    attributes: { type: Schema.Types.Mixed, default: {} },
    variants: [VariantSchema],
    stock: { type: Number, default: 0 },
    sku: String,
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search across title, description, tags
ProductSchema.index({ title: "text", description: "text", tags: "text" });
// Common filter/sort compound indexes
ProductSchema.index({ category: 1, isActive: 1, price: 1 });
ProductSchema.index({ featured: 1, isActive: 1 });

export const Product: Model<IProduct> =
  models.Product || model<IProduct>("Product", ProductSchema);
