export const dynamic = "force-dynamic";

import { FeaturedSection } from "@/components/FeaturedSection";

export default function HomePage() {
  return (
    <main>
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
