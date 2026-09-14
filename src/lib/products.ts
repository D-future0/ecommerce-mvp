import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Types } from "mongoose";

export type SortOption = "newest" | "price_asc" | "price_desc" | "rating" | "popular";

export interface ProductQuery {
  categorySlug?: string;
  q?: string;
  filters?: Record<string, string[]>; // attribute key -> selected values
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

const SORT_MAP: Record<SortOption, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { ratingAverage: -1 },
  popular: { soldCount: -1 },
};

export async function getProducts(query: ProductQuery) {
  await connectToDatabase();

  const {
    categorySlug,
    q,
    filters = {},
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = query;

  const match: Record<string, unknown> = { isActive: true };

  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug }).lean();
    if (!category) return { products: [], total: 0, page, pages: 0, category: null };
    match.category = category._id;
  }

  if (q?.trim()) {
    match.$text = { $search: q.trim() };
  }

  if (minPrice != null || maxPrice != null) {
    match.price = {
      ...(minPrice != null ? { $gte: minPrice } : {}),
      ...(maxPrice != null ? { $lte: maxPrice } : {}),
    };
  }

  for (const [key, values] of Object.entries(filters)) {
    if (values?.length) {
      match[`attributes.${key}`] = { $in: values };
    }
  }

  const sortStage = SORT_MAP[sort] ?? SORT_MAP.newest;
  const skip = (page - 1) * limit;

  const [products, total, category] = await Promise.all([
    Product.find(match).sort(sortStage).skip(skip).limit(limit).lean(),
    Product.countDocuments(match),
    categorySlug ? Category.findOne({ slug: categorySlug }).lean() : null,
  ]);

  return {
    products,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    category,
  };
}

export async function getFeaturedProducts(limit = 8) {
  await connectToDatabase();
  return Product.find({ isActive: true, featured: true }).sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getProductBySlug(slug: string) {
  await connectToDatabase();
  return Product.findOne({ slug, isActive: true }).populate("category", "name slug").lean();
}

export async function getRelatedProducts(product: {
  _id: Types.ObjectId | string;
  category: Types.ObjectId | string;
  relatedProducts?: (Types.ObjectId | string)[];
}) {
  await connectToDatabase();

  if (product.relatedProducts?.length) {
    const related = await Product.find({
      _id: { $in: product.relatedProducts },
      isActive: true,
    }).lean();
    if (related.length) return related;
  }

  return Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .sort({ soldCount: -1 })
    .limit(4)
    .lean();
}
