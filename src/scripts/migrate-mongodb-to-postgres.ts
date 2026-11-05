import { config } from "dotenv";
import { MongoClient, ObjectId, type Document } from "mongodb";
import { Prisma } from "@prisma/client";

type MongoRecord = Document & { _id: ObjectId | string };
type JsonData = string | number | boolean | null | JsonData[] | { [key: string]: JsonData };

function id(value: unknown, field: string): string {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && value.length > 0) return value;
  throw new Error(`MongoDB migration: missing or invalid ${field}`);
}

function toJsonData(value: unknown): JsonData {
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((entry) => entry === undefined ? null : toJsonData(entry));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, entry]) =>
        entry === undefined ? [] : [[key, toJsonData(entry)]]
      )
    );
  }
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  throw new Error(`MongoDB migration: cannot convert ${typeof value} to JSON`);
}

function jsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull {
  const converted = toJsonData(value);
  return converted === null ? Prisma.JsonNull : converted;
}

function date(value: unknown): Date {
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(parsed.getTime())) throw new Error("MongoDB migration: invalid timestamp");
  return parsed;
}

function records(values: unknown): MongoRecord[] {
  return Array.isArray(values) ? values as MongoRecord[] : [];
}

async function main() {
  config({ path: ".env.local" });
  config({ path: ".env" });

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("Set MONGODB_URI to the source MongoDB connection string");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the Neon pooled connection string");
  if (!process.env.DIRECT_URL) throw new Error("Set DIRECT_URL to the Neon direct connection string");

  const { prisma } = await import("../lib/db");
  const mongo = new MongoClient(mongoUri);

  try {
    await Promise.all([mongo.connect(), prisma.$connect()]);
    const [usersCount, categoriesCount, collectionsCount, productsCount, ordersCount, cartsCount, reviewsCount, bannersCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.collection.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.cart.count(),
        prisma.review.count(),
        prisma.banner.count(),
      ]);
    if ([usersCount, categoriesCount, collectionsCount, productsCount, ordersCount, cartsCount, reviewsCount, bannersCount].some((count) => count > 0)) {
      throw new Error("The Neon database is not empty. Import only into an empty database to avoid duplicates.");
    }

    const source = mongo.db();
    const [userDocs, categoryDocs, collectionDocs, productDocs, orderDocs, cartDocs, reviewDocs, bannerDocs] =
      await Promise.all([
        source.collection("users").find().toArray(),
        source.collection("categories").find().toArray(),
        source.collection("collections").find().toArray(),
        source.collection("products").find().toArray(),
        source.collection("orders").find().toArray(),
        source.collection("carts").find().toArray(),
        source.collection("reviews").find().toArray(),
        source.collection("banners").find().toArray(),
      ]);

    const users = records(userDocs);
    const categories = records(categoryDocs);
    const collections = records(collectionDocs);
    const products = records(productDocs);
    const orders = records(orderDocs);
    const carts = records(cartDocs);
    const reviews = records(reviewDocs);
    const banners = records(bannerDocs);
    const userIds = new Set(users.map((item) => id(item._id, "user id")));
    const categoryIds = new Set(categories.map((item) => id(item._id, "category id")));
    const collectionIds = new Set(collections.map((item) => id(item._id, "collection id")));
    const productIds = new Set(products.map((item) => id(item._id, "product id")));

    for (const category of categories) {
      if (category.parent && !categoryIds.has(id(category.parent, "category parent id"))) {
        throw new Error(`MongoDB migration: category ${id(category._id, "category id")} references a missing parent`);
      }
    }
    for (const product of products) {
      if (!categoryIds.has(id(product.category, "product category id"))) {
        throw new Error(`MongoDB migration: product ${id(product._id, "product id")} references a missing category`);
      }
      if (Array.isArray(product.collections)) {
        for (const collection of product.collections) {
          if (!collectionIds.has(id(collection, "product collection id"))) {
            throw new Error(`MongoDB migration: product ${id(product._id, "product id")} references a missing collection`);
          }
        }
      }
    }
    for (const order of orders) {
      if (!userIds.has(id(order.user, "order user id"))) {
        throw new Error(`MongoDB migration: order ${id(order._id, "order id")} references a missing user`);
      }
    }
    for (const cart of carts) {
      if (!userIds.has(id(cart.user, "cart user id"))) {
        throw new Error(`MongoDB migration: cart ${id(cart._id, "cart id")} references a missing user`);
      }
    }
    for (const review of reviews) {
      if (!productIds.has(id(review.product, "review product id"))) {
        throw new Error(`MongoDB migration: review ${id(review._id, "review id")} references a missing product`);
      }
      if (!userIds.has(id(review.user, "review user id"))) {
        throw new Error(`MongoDB migration: review ${id(review._id, "review id")} references a missing user`);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.createMany({
        data: users.map((user) => ({
          id: id(user._id, "user id"),
          name: String(user.name ?? ""),
          email: String(user.email ?? "").toLowerCase(),
          passwordHash: String(user.passwordHash ?? ""),
          phone: String(user.phone ?? ""),
          mobile: String(user.mobile ?? ""),
          role: String(user.role ?? "customer"),
          wishlist: Array.isArray(user.wishlist) ? user.wishlist.map((item: unknown) => id(item, "wishlist product id")) : [],
          recentlyViewed: jsonValue(user.recentlyViewed ?? []),
          addresses: jsonValue(user.addresses ?? []),
          billingAddress: user.billingAddress ? jsonValue(user.billingAddress) : Prisma.DbNull,
          isDeactivated: Boolean(user.isDeactivated),
          deactivatedAt: user.deactivatedAt ? date(user.deactivatedAt) : null,
          createdAt: date(user.createdAt),
          updatedAt: date(user.updatedAt ?? user.createdAt),
        })),
      });

      await tx.category.createMany({
        data: categories.map((category) => ({
          id: id(category._id, "category id"),
          name: String(category.name ?? ""),
          slug: String(category.slug ?? ""),
          description: category.description == null ? null : String(category.description),
          image: category.image == null ? null : String(category.image),
          parent: null,
          featured: Boolean(category.featured),
          filters: jsonValue(category.filters ?? []),
          showOnHome: Boolean(category.showOnHome),
          homeOrder: Number(category.homeOrder ?? 100),
          homeTheme: String(category.homeTheme ?? "purple"),
          homeDisplayMode: String(category.homeDisplayMode ?? "grid"),
          createdAt: date(category.createdAt),
          updatedAt: date(category.updatedAt ?? category.createdAt),
        })),
      });
      for (const category of categories) {
        if (!category.parent) continue;
        const parentId = id(category.parent, "category parent id");
        await tx.category.update({
          where: { id: id(category._id, "category id") },
          data: { parent: parentId },
        });
      }

      await tx.collection.createMany({
        data: collections.map((collection) => ({
          id: id(collection._id, "collection id"),
          title: String(collection.title ?? ""),
          slug: String(collection.slug ?? ""),
          description: collection.description == null ? null : String(collection.description),
          image: collection.image == null ? null : String(collection.image),
          seoTitle: collection.seoTitle == null ? null : String(collection.seoTitle),
          seoDescription: collection.seoDescription == null ? null : String(collection.seoDescription),
          showOnHome: Boolean(collection.showOnHome),
          homeOrder: Number(collection.homeOrder ?? 100),
          homeTheme: String(collection.homeTheme ?? "purple"),
          homeDisplayMode: String(collection.homeDisplayMode ?? "grid"),
          createdAt: date(collection.createdAt),
          updatedAt: date(collection.updatedAt ?? collection.createdAt),
        })),
      });

      await tx.product.createMany({
        data: products.map((product) => {
          const categoryId = id(product.category, "product category id");
          return {
            id: id(product._id, "product id"),
            title: String(product.title ?? ""),
            slug: String(product.slug ?? ""),
            description: String(product.description ?? ""),
            seoTitle: product.seoTitle == null ? null : String(product.seoTitle),
            seoDescription: product.seoDescription == null ? null : String(product.seoDescription),
            price: Number(product.price ?? 0),
            compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
            currency: String(product.currency ?? "NGN"),
            images: Array.isArray(product.images) ? product.images.map(String) : [],
            category: categoryId,
            tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
            attributes: jsonValue(product.attributes ?? {}),
            variants: jsonValue(product.variants ?? []),
            stock: Number(product.stock ?? 0),
            sku: product.sku == null ? null : String(product.sku),
            featured: Boolean(product.featured),
            isActive: product.isActive !== false,
            relatedProducts: Array.isArray(product.relatedProducts)
              ? product.relatedProducts.map((item: unknown) => id(item, "related product id"))
              : [],
            ratingAverage: Number(product.ratingAverage ?? 0),
            ratingCount: Number(product.ratingCount ?? 0),
            soldCount: Number(product.soldCount ?? 0),
            createdAt: date(product.createdAt),
            updatedAt: date(product.updatedAt ?? product.createdAt),
          };
        }),
      });

      const productCollections = products.flatMap((product) => {
        const productId = id(product._id, "product id");
        const relatedCollections = Array.isArray(product.collections)
          ? product.collections.map((item: unknown) => id(item, "product collection id"))
          : [];
        return [...new Set(relatedCollections)]
          .map((collectionId) => ({ productId, collectionId }));
      });
      await tx.productCollection.createMany({ data: productCollections, skipDuplicates: true });

      await tx.order.createMany({
        data: orders.map((order) => {
          const userId = id(order.user, "order user id");
          return {
            id: id(order._id, "order id"),
            user: userId,
            items: jsonValue(order.items ?? []),
            subtotal: Number(order.subtotal ?? 0),
            shippingFee: Number(order.shippingFee ?? 0),
            total: Number(order.total ?? 0),
            currency: String(order.currency ?? "NGN"),
            deliveryMethod: order.deliveryMethod == null ? null : String(order.deliveryMethod),
            deliveryType: order.deliveryType == null ? null : String(order.deliveryType),
            status: String(order.status ?? "pending"),
            shippingAddress: jsonValue(order.shippingAddress ?? {}),
            paystackReference: String(order.paystackReference ?? ""),
            paystackAuthorizationUrl: order.paystackAuthorizationUrl == null ? null : String(order.paystackAuthorizationUrl),
            paidAt: order.paidAt ? date(order.paidAt) : null,
            createdAt: date(order.createdAt),
            updatedAt: date(order.updatedAt ?? order.createdAt),
          };
        }),
      });

      await tx.cart.createMany({
        data: carts.map((cart) => {
          const userId = id(cart.user, "cart user id");
          return {
            id: id(cart._id, "cart id"),
            user: userId,
            createdAt: date(cart.createdAt),
            updatedAt: date(cart.updatedAt ?? cart.createdAt),
          };
        }),
      });
      const cartItems = carts.flatMap((cart) => {
        const cartId = id(cart._id, "cart id");
        const groupedItems = new Map<string, { product: string; variant: string; quantity: number; position: number }>();
        const items = Array.isArray(cart.items) ? cart.items as Document[] : [];
        for (const [position, rawItem] of items.entries()) {
          const product = id(rawItem.product, "cart item product id");
          const variant = rawItem.variant == null ? "" : String(rawItem.variant);
          const key = `${product}\u0000${variant}`;
          const existing = groupedItems.get(key);
          if (existing) {
            existing.quantity += Number(rawItem.quantity ?? 1);
          } else {
            groupedItems.set(key, {
              product,
              variant,
              quantity: Number(rawItem.quantity ?? 1),
              position,
            });
          }
        }
        return [...groupedItems.values()].map((item) => ({ cartId, ...item }));
      });
      await tx.cartItem.createMany({ data: cartItems, skipDuplicates: true });

      await tx.review.createMany({
        data: reviews.map((review) => {
          const productId = id(review.product, "review product id");
          const userId = id(review.user, "review user id");
          return {
            id: id(review._id, "review id"),
            product: productId,
            user: userId,
            rating: Number(review.rating),
            title: review.title == null ? null : String(review.title),
            body: String(review.body ?? ""),
            verifiedPurchase: Boolean(review.verifiedPurchase),
            createdAt: date(review.createdAt),
            updatedAt: date(review.updatedAt ?? review.createdAt),
          };
        }),
      });

      await tx.banner.createMany({
        data: banners.map((banner) => ({
          id: id(banner._id, "banner id"),
          title: String(banner.title ?? ""),
          subtitle: banner.subtitle == null ? null : String(banner.subtitle),
          image: String(banner.image ?? ""),
          href: banner.href == null ? null : String(banner.href),
          active: banner.active !== false,
          sortOrder: Number(banner.sortOrder ?? 0),
          createdAt: date(banner.createdAt),
          updatedAt: date(banner.updatedAt ?? banner.createdAt),
        })),
      });
    }, { maxWait: 10_000, timeout: 600_000 });

    console.log("MongoDB data copied to PostgreSQL:", {
      users: users.length,
      categories: categories.length,
      collections: collections.length,
      products: products.length,
      orders: orders.length,
      carts: carts.length,
      reviews: reviews.length,
      banners: banners.length,
    });
  } finally {
    await Promise.all([mongo.close(), prisma.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
