export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";

export default async function AdminCollectionsPage() {
  await connectToDatabase();
  const collections = await Collection.find().sort({ title: 1 }).lean();
  const counts = await Product.aggregate([{ $unwind: "$collections" }, { $group: { _id: "$collections", count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
  return <div><div className="flex items-center justify-between"><h2 className="text-sm text-ink">{collections.length} collections</h2><Link href="/admin/collections/new" className="bg-ink px-4 py-2 text-sm text-paper">New collection</Link></div><div className="mt-6 divide-y divide-line border-y border-line">{collections.map((collection) => <div key={collection._id.toString()} className="flex items-center justify-between py-4"><div><Link href={`/admin/collections/${collection._id}`} className="text-sm text-ink">{collection.title}</Link><p className="text-xs text-stone">/{collection.slug} · {countMap.get(collection._id.toString()) ?? 0} products</p></div><Link href={`/admin/collections/${collection._id}`} className="text-xs text-stone underline underline-offset-2">Edit</Link></div>)}</div>{collections.length === 0 && <p className="mt-6 text-sm text-stone">No collections yet.</p>}</div>;
}
