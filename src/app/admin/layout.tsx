import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Admin</h1>
        <Link href="/" className="text-xs text-stone underline underline-offset-2">
          Back to store
        </Link>
      </div>

      <nav className="mt-6 flex gap-6 border-b border-line pb-4 text-sm">
        <Link href="/admin" className="text-ink">
          Dashboard
        </Link>
        <Link href="/admin/products" className="text-stone hover:text-ink">
          Products
        </Link>
        <Link href="/admin/categories" className="text-stone hover:text-ink">
          Categories
        </Link>
        <Link href="/admin/banners" className="text-stone hover:text-ink">
          Banners
        </Link>
        <Link href="/admin/orders" className="text-stone hover:text-ink">
          Orders
        </Link>
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
