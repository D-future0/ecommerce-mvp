export const dynamic = "force-dynamic";

import { FeaturedSection } from "@/components/FeaturedSection";
import { BannerCarousel, BannerItem } from "@/components/BannerCarousel";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { toPlain } from "@/lib/serialize";
import type { ProductListItem } from "@/types/product";

type HomeCollection = {
  _id: string;
  name: string;
  slug: string;
  homeTheme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode?: "grid" | "carousel";
  image?: string;
};

export default async function HomePage() {
  await connectToDatabase();
  const bannerDocs = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  const banners = toPlain<BannerItem[]>(bannerDocs);

  const collections = toPlain<HomeCollection[]>(
    await Category.find({ isCollection: true, showOnHome: true, parent: null })
      .sort({ homeOrder: 1, name: 1 })
      .lean()
  );

  return (
    <main>
      {banners.length > 0 && (
        <div className="pt-6">
          <BannerCarousel banners={banners} />
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="max-w-lg font-serif text-4xl leading-tight">
          Considered pieces, made to last.
        </h1>
        <p className="mt-4 max-w-md text-stone">
          Browse the catalog, filter by what matters to you, and read honest
          reviews from other customers before you buy.
        </p>
      </div>

      {collections.length > 0 ? (
        <>
          {(
            await Promise.all(
              collections.map(async (collection) => {
                const collectionProducts = await Product.find({ category: collection._id, isActive: true })
                  .sort({ createdAt: -1 })
                  .limit(4)
                  .lean();

                return (
                  <FeaturedSection
                    key={String(collection._id)}
                    title={collection.name}
                    categorySlug={collection.slug}
                    products={toPlain<ProductListItem[]>(collectionProducts)}
                    theme={collection.homeTheme ?? "purple"}
                    displayMode={collection.homeDisplayMode ?? "grid"}
                    image={collection.image}
                  />
                );
              })
            )
          )}
        </>
      ) : (
        <FeaturedSection />
      )}
    </main>
  );
}
