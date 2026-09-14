export const dynamic = "force-dynamic";

import { FeaturedSection } from "@/components/FeaturedSection";
import { BannerCarousel, BannerItem } from "@/components/BannerCarousel";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { toPlain } from "@/lib/serialize";

export default async function HomePage() {
  await connectToDatabase();
  const bannerDocs = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  const banners = toPlain<BannerItem[]>(bannerDocs);

  return (
    <main>
      {banners.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
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

      <FeaturedSection />
    </main>
  );
}
