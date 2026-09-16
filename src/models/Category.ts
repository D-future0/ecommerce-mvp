import { Schema, model, models, Types, Model } from "mongoose";

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | null;
  isCollection?: boolean;
  featured?: boolean;
  filters: {
    key: string; // e.g. "size", "color", "material"
    label: string;
    options: string[];
  }[];
  showOnHome: boolean;
  homeOrder: number;
  homeTheme: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode: "grid" | "carousel";
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    image: String,
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isCollection: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    filters: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        options: [String],
      },
    ],
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

export const Category: Model<ICategory> =
  models.Category || model<ICategory>("Category", CategorySchema);
