import { Schema, model, models, Model, Types } from "mongoose";

export interface IBanner {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  image: string;
  href?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: String, required: true },
    href: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

export const Banner: Model<IBanner> = models.Banner || model<IBanner>("Banner", BannerSchema);
