import { Schema, model, models, Types, Model } from "mongoose";

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | null;
  filters: {
    key: string; // e.g. "size", "color", "material"
    label: string;
    options: string[];
  }[];
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
    filters: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        options: [String],
      },
    ],
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  models.Category || model<ICategory>("Category", CategorySchema);
