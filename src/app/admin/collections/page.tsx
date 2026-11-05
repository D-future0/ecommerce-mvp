export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";
import { prisma } from "@/lib/db";
import { HomeCollectionsManager } from "@/components/admin/HomeCollectionsManager";

function isHomeTheme(value: string): value is "purple" | "rose" | "slate" | "emerald" | "gold" {
  return value === "purple" || value === "rose" || value === "slate" || value === "emerald" || value === "gold";
}

function isHomeDisplayMode(value: string): value is "grid" | "carousel" {
  return value === "grid" || value === "carousel";
}

export default async function AdminCollectionsPage() {
  await connectToDatabase();
  const [collections, counts] = await Promise.all([
    Collection.findMany({ orderBy: { title: "asc" } }),
    prisma.productCollection.groupBy({
      by: ["collectionId"],
      _count: { _all: true },
    }),
  ]);
  const countMap = new Map(counts.map((entry) => [entry.collectionId, entry._count._all]));
  const homepageCollections = collections.map((collection) => ({
    id: String(collection.id),
    name: collection.title,
    showOnHome: collection.showOnHome,
    homeOrder: collection.homeOrder,
    homeTheme: isHomeTheme(collection.homeTheme) ? collection.homeTheme : "purple",
    homeDisplayMode: isHomeDisplayMode(collection.homeDisplayMode) ? collection.homeDisplayMode : "grid",
  }));
  return <div><div className="flex items-center justify-between"><h2 className="text-sm text-ink">{collections.length} collections</h2><Link href="/admin/collections/new" className="bg-ink px-4 py-2 text-sm text-paper">New collection</Link></div><div className="mt-6 divide-y divide-line border-y border-line">{collections.map((collection) => <div key={collection.id.toString()} className="flex items-center justify-between py-4"><div><Link href={`/admin/collections/${collection.id}`} className="text-sm text-ink">{collection.title}</Link><p className="text-xs text-stone">/{collection.slug} · {countMap.get(collection.id.toString()) ?? 0} products</p></div><Link href={`/admin/collections/${collection.id}`} className="text-xs text-stone underline underline-offset-2">Edit</Link></div>)}</div>{collections.length === 0 && <p className="mt-6 text-sm text-stone">No collections yet.</p>}<HomeCollectionsManager collections={homepageCollections} /></div>;
}
