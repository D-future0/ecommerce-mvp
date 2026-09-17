export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/models/Collection";
import { toPlain } from "@/lib/serialize";
import { CollectionForm, CollectionFormValues } from "@/components/admin/CollectionForm";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const collection = await Collection.findById((await params).id).lean();
  if (!collection) notFound();
  return <div><h2 className="text-sm text-ink">Edit collection</h2><div className="mt-6"><CollectionForm initial={toPlain<CollectionFormValues>(collection)} /></div></div>;
}
