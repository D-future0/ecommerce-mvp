import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import type { Prisma } from "@prisma/client";

export type SortOption = "newest" | "price_asc" | "price_desc" | "rating" | "popular";

export interface ProductQuery {
  categorySlug?: string;
  collectionSlug?: string;
  q?: string;
  filters?: Record<string, string[]>;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

const SORT_MAP: Record<SortOption, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  rating: { ratingAverage: "desc" },
  popular: { soldCount: "desc" },
};

export async function getProducts(query: ProductQuery) {
  await connectToDatabase();

  const {
    categorySlug,
    collectionSlug,
    q,
    filters = {},
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = query;

  const category = categorySlug
    ? await Category.findUnique({ where: { slug: categorySlug } })
    : null;
  if (categorySlug && !category) {
    return { products: [], total: 0, page, pages: 0, category: null };
  }

  const collection = collectionSlug
    ? await Collection.findUnique({ where: { slug: collectionSlug } })
    : null;
  if (collectionSlug && !collection) {
    return { products: [], total: 0, page, pages: 0, category: null, collection: null };
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: category.id } : {}),
    ...(collection
      ? { collections: { some: { collectionId: collection.id } } }
      : {}),
    ...(minPrice != null || maxPrice != null
      ? { price: { ...(minPrice != null ? { gte: minPrice } : {}), ...(maxPrice != null ? { lte: maxPrice } : {}) } }
      : {}),
  };

  if (q?.trim()) {
    const search = q.trim();
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const attributeFilters = Object.entries(filters).flatMap(([key, values]) =>
    (values ?? []).map((value) => ({
      attributes: { path: [key], equals: value },
    }))
  );
  if (attributeFilters.length) {
    where.AND = attributeFilters;
  }

  const skip = Math.max(page - 1, 0) * limit;
  const [products, total] = await Promise.all([
    Product.findMany({ where, orderBy: SORT_MAP[sort] ?? SORT_MAP.newest, skip, take: limit }),
    Product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    category,
    collection,
  };
}

export async function getFeaturedProducts(limit = 8) {
  await connectToDatabase();
  return Product.findMany({
    where: { isActive: true, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  await connectToDatabase();
  const product = await Product.findFirst({
    where: { slug, isActive: true },
    include: { categoryRef: true, collections: { include: { collection: true } } },
  });
  if (!product) return null;

  const { categoryRef, collections, ...rest } = product;
  return {
    ...rest,
    category: categoryRef,
    collections: collections.map(({ collection: item }) => item),
  };
}

export async function getRelatedProducts(product: {
  id: string;
  category: string | { id: string };
  relatedProducts?: string[];
}) {
  await connectToDatabase();

  if (product.relatedProducts?.length) {
    const related = await Product.findMany({
      where: { id: { in: product.relatedProducts }, isActive: true },
    });
    if (related.length) return related;
  }

  const categoryId = typeof product.category === "string" ? product.category : product.category.id;
  return Product.findMany({
    where: { category: categoryId, id: { not: product.id }, isActive: true },
    orderBy: { soldCount: "desc" },
    take: 4,
  });
}
