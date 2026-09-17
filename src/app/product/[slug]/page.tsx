export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { connectToDatabase } from "@/lib/db";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { ProductGallery } from "@/components/ProductGallery";
import { PurchasePanel } from "@/components/PurchasePanel";
import { RelatedProducts } from "@/components/RelatedProducts";
import { ReviewForm } from "@/components/ReviewForm";
import { ViewTracker } from "@/components/ViewTracker";
import type { ProductListItem } from "@/types/product";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const description = product.seoDescription || product.description;
  return {
    title: product.seoTitle || `${product.title} — Store`,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.seoTitle || product.title,
      description,
      type: "website",
      images: product.images[0] ? [{ url: product.images[0], alt: product.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: product.seoTitle || product.title, description, images: product.images[0] ? [product.images[0]] : undefined },
  };
}

interface ReviewDoc {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  user: { name: string } | null;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const productDoc = await getProductBySlug(slug);
  if (!productDoc) notFound();

  const [relatedDocs, reviewDocs, session] = await Promise.all([
    getRelatedProducts(productDoc),
    (async () => {
      await connectToDatabase();
      return Review.find({ product: productDoc._id })
        .sort({ createdAt: -1 })
        .populate("user", "name")
        .lean();
    })(),
    getServerSession(authOptions),
  ]);

  let canReview = false;
  let initiallyWishlisted = false;
  if (session?.user) {
    const [user, purchase] = await Promise.all([
      User.findById(session.user.id).select("wishlist").lean(),
      Order.exists({
        user: session.user.id,
        status: { $in: ["paid", "processing", "shipped", "delivered"] },
        "items.product": productDoc._id,
      }),
    ]);

    initiallyWishlisted = !!user?.wishlist.some((id) => id.toString() === productDoc._id.toString());
    canReview = session.user.role === "admin" || !!purchase;
  }

  const product = toPlain<{
    _id: string;
    slug: string;
    title: string;
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    price: number;
    currency: string;
    images: string[];
    variants: { name: string; value: string; priceDelta?: number; stock: number; sku: string }[];
    category: { name: string; slug: string };
    ratingAverage: number;
    ratingCount: number;
  }>(productDoc);

  const related = toPlain<ProductListItem[]>(relatedDocs);
  const reviews = toPlain<ReviewDoc[]>(reviewDocs);
  const productUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/product/${product.slug}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.seoDescription || product.description,
    image: product.images,
    sku: product._id,
    category: product.category.name,
    url: productUrl,
    offers: { "@type": "Offer", url: productUrl, priceCurrency: product.currency, price: (product.price / 100).toFixed(2), availability: "https://schema.org/InStock" },
    aggregateRating: product.ratingCount > 0 ? { "@type": "AggregateRating", ratingValue: product.ratingAverage, reviewCount: product.ratingCount } : undefined,
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ViewTracker slug={slug} />

      <p className="mb-6 text-sm text-stone">
        <span className="mr-2 text-stone">Category</span>
        <a href={`/category/${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </a>
      </p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="lg:pt-2">
          <h1 className="font-serif text-3xl">{product.title}</h1>

          {product.ratingCount > 0 && (
            <p className="mt-2 text-sm text-stone">
              {product.ratingAverage.toFixed(1)} ★ · {product.ratingCount}{" "}
              {product.ratingCount === 1 ? "review" : "reviews"}
            </p>
          )}

          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink">{product.description}</p>

          <div className="mt-8 max-w-sm">
            <PurchasePanel
              productId={product._id}
              basePrice={product.price}
              currency={product.currency}
              variants={product.variants}
              initiallyWishlisted={initiallyWishlisted}
            />
          </div>
        </div>
      </div>

      <section className="mx-auto mt-20 max-w-2xl border-t border-line pt-10">
        <h2 className="font-serif text-2xl">Reviews</h2>

        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-stone">No reviews yet — be the first to write one.</p>
        ) : (
          <ul className="mt-6 space-y-6">
            {reviews.map((review) => (
              <li key={review._id} className="border-b border-line pb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink">{"★".repeat(review.rating)}</span>
                  <span className="text-line">{"★".repeat(5 - review.rating)}</span>
                  {review.title && <span className="text-ink">{review.title}</span>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{review.body}</p>
                <p className="mt-2 text-xs text-stone">
                  {review.user?.name ?? "Anonymous"}
                  {review.verifiedPurchase ? " · Verified purchase" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          {canReview ? (
            <ReviewForm slug={slug} />
          ) : (
            <p className="text-sm text-stone">
              Purchase this item to leave a review, or contact support if you are an admin.
            </p>
          )}
        </div>
      </section>

      <RelatedProducts products={related} />
    </main>
  );
}
