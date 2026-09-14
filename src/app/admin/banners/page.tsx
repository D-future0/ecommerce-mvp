export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";

export default async function AdminBannersPage() {
  await connectToDatabase();
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm text-ink">Homepage banners</h2>
          <p className="mt-1 text-xs text-stone">Active banners appear in order. One banner displays statically; multiple rotate automatically.</p>
        </div>
        <Link href="/admin/banners/new" className="bg-ink px-4 py-2 text-sm text-paper">New banner</Link>
      </div>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {banners.map((banner) => (
          <div key={banner._id.toString()} className="flex items-center gap-4 py-4">
            <img src={banner.image} alt="" className="h-16 w-28 object-cover" />
            <div className="min-w-0 flex-1">
              <Link href={`/admin/banners/${banner._id}`} className="text-sm text-ink">{banner.title}</Link>
              <p className="text-xs text-stone">Order {banner.sortOrder} · {banner.active ? "Active" : "Inactive"}</p>
            </div>
            <Link href={`/admin/banners/${banner._id}`} className="text-xs text-stone underline underline-offset-2">Edit</Link>
          </div>
        ))}
      </div>
      {banners.length === 0 && <p className="mt-6 text-sm text-stone">No banners yet.</p>}
    </div>
  );
}
