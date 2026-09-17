import { Schema, model, models, Types, Model } from "mongoose";

export interface ICollection {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  showOnHome: boolean;
  homeOrder: number;
  homeTheme: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode: "grid" | "carousel";
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    image: String,
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
      showOnHome: { type: Boolean, default: false },
      homeOrder: { type: Number, default: 100 },
      homeTheme: {
        type: String,
        enum: ["purple", "rose", "slate", "emerald", "gold"],
        default: "purple",
      },
      homeDisplayMode: { type: String, enum: ["grid", "carousel"], default: "grid" },
  },
  { timestamps: true }
);

export const Collection: Model<ICollection> =
  models.Collection || model<ICollection>("Collection", CollectionSchema);
