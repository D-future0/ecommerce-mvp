export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProducts, SortOption } from "@/lib/products";
import { toPlain } from "@/lib/serialize";
import { ProductCard } from "@/components/ProductCard";
import { SortSelect } from "@/components/SortSelect";
import { Pagination } from "@/components/Pagination";
import type { ProductListItem } from "@/types/product";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getProducts({ collectionSlug: (await params).slug, limit: 1 });
  if (!result.collection) return { title: "Collection not found" };
  return { title: result.collection.seoTitle || `${result.collection.title} — Store`, description: result.collection.seoDescription || result.collection.description };
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const slug = (await params).slug;
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const result = await getProducts({ collectionSlug: slug, sort: (sp.sort as SortOption) ?? "newest", page });
  if (!result.collection) notFound();
  const collection = toPlain<{ title: string; description?: string }>(result.collection);
  const products = toPlain<ProductListItem[]>(result.products);
  const makeHref = (value: number) => { const query = new URLSearchParams(sp as Record<string, string>); query.set("page", String(value)); return `/collection/${slug}?${query.toString()}`; };

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="mb-10 max-w-xl"><p className="text-xs uppercase tracking-[0.18em] text-stone">Collection</p><h1 className="mt-2 font-serif text-3xl">{collection.title}</h1>{collection.description && <p className="mt-2 text-stone">{collection.description}</p>}</div><div className="mb-6 flex items-center justify-between"><p className="text-sm text-stone">{result.total} {result.total === 1 ? "item" : "items"}</p><SortSelect /></div>{products.length === 0 ? <p className="py-20 text-center text-stone">No products in this collection yet.</p> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}<Pagination page={result.page} pages={result.pages} makeHref={makeHref} /><p className="mt-8 text-sm"><Link href="/search" className="text-stone underline underline-offset-2">Browse all products</Link></p></main>;
}
