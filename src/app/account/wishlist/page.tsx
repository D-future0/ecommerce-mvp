export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import type { ProductListItem } from "@/types/product";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null; // middleware redirects to /login before this renders

  await connectToDatabase();
  const user = await User.findById(session.user.id).populate("wishlist").lean();
  const products = toPlain<ProductListItem[]>(user?.wishlist ?? []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl">Wishlist</h1>

      {products.length === 0 ? (
        <div className="mt-10 text-center text-stone">
          <p>Nothing saved yet.</p>
          <Link href="/" className="mt-3 inline-block text-sm text-ink underline underline-offset-2">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
