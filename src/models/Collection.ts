import { Schema, model, models, Types, Model } from "mongoose";

export interface ICollection {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
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
  },
  { timestamps: true }
);

export const Collection: Model<ICollection> =
  models.Collection || model<ICollection>("Collection", CollectionSchema);
