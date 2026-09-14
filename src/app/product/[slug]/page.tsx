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
  return { title: product ? `${product.title} — Store` : "Product not found" };
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

  let initiallyWishlisted = false;
  if (session?.user) {
    const user = await User.findById(session.user.id).select("wishlist").lean();
    initiallyWishlisted = !!user?.wishlist.some((id) => id.toString() === productDoc._id.toString());
  }

  const product = toPlain<{
    _id: string;
    title: string;
    description: string;
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ViewTracker slug={slug} />

      <p className="mb-6 text-sm text-stone">
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
          <ReviewForm slug={slug} />
        </div>
      </section>

      <RelatedProducts products={related} />
    </main>
  );
}
