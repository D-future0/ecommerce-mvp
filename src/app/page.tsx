export const dynamic = "force-dynamic";

import { FeaturedSection } from "@/components/FeaturedSection";
import { BannerCarousel, BannerItem } from "@/components/BannerCarousel";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";
import { toPlain } from "@/lib/serialize";
import type { ProductListItem } from "@/types/product";
import { Fragment } from "react";

type HomeCollection = {
  id: string;
  title: string;
  slug: string;
  homeTheme?: "purple" | "rose" | "slate" | "emerald" | "gold";
  homeDisplayMode?: "grid" | "carousel";
  image?: string;
};

export default async function HomePage() {
  await connectToDatabase();
  const bannerDocs = await Banner.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const banners = toPlain<BannerItem[]>(bannerDocs);

  const collections = toPlain<HomeCollection[]>(
    await Collection.findMany({
      where: { showOnHome: true },
      orderBy: [{ homeOrder: "asc" }, { title: "asc" }],
    })
  );
  const collectionSections = await Promise.all(
    collections.map(async (collection) => {
      const collectionProducts = await Product.findMany({
        where: {
          collections: { some: { collectionId: collection.id } },
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      return (
        <FeaturedSection
          key={collection.id}
          title={collection.title}
          collectionSlug={collection.slug}
          products={toPlain<ProductListItem[]>(collectionProducts)}
          theme={collection.homeTheme ?? "purple"}
          displayMode={collection.homeDisplayMode ?? "grid"}
          image={collection.image}
        />
      );
    })
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

      {collectionSections.length > 0 ? (
        <>
          {collectionSections.map((section, index) => (
            <Fragment key={collections[index].id}>
              {section}
              {banners.length > 0 && index < collectionSections.length - 1 && (
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <BannerCarousel
                    banners={[banners[index % banners.length]]}
                    size="section"
                  />
                </div>
              )}
            </Fragment>
          ))}
        </>
      ) : (
        <FeaturedSection />
      )}
    </main>
  );
}
