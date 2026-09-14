import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { Heart, User, ShoppingBag } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { getCartItems } from "@/lib/cart";
import { SearchBar } from "@/components/SearchBar";

export async function SiteHeader() {
  // Swallow DB errors here rather than crashing the whole layout (and static
  // builds like /_not-found, which render without a live DB connection) —
  // the header degrades to no category links instead of a 500.
  const categories = await connectToDatabase()
    .then(() => Category.find({ parent: null }).sort({ name: 1 }).limit(6).lean())
    .catch(() => []);

  const session = await getServerSession(authOptions).catch(() => null);
  const cartItems = session?.user ? await getCartItems(session.user.id).catch(() => []) : [];
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="font-serif text-xl shrink-0">
            Store
          </Link>

          <div className="hidden md:block flex-1 max-w-xs">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <Link href="/account/wishlist" aria-label="Wishlist" className="text-ink">
              <Heart size={18} strokeWidth={1.5} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative text-ink">
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[10px] text-paper">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/account" aria-label="Account" className="text-ink">
              <User size={18} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className="text-stone hover:text-ink">
              {cat.name}
            </Link>
          ))}
        </nav>

        <div className="mt-3 md:hidden">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
