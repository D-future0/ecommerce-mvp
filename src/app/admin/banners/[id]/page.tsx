export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Banner } from "@/models/Banner";
import { toPlain } from "@/lib/serialize";
import { BannerForm, BannerFormValues } from "@/components/admin/BannerForm";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const bannerDoc = await Banner.findById(id).lean();
  if (!bannerDoc) notFound();

  return (
    <div>
      <h2 className="text-sm text-ink">Edit homepage banner</h2>
      <div className="mt-6"><BannerForm initial={toPlain<BannerFormValues>(bannerDoc)} /></div>
    </div>
  );
}
