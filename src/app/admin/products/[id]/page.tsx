export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";
import { toPlain } from "@/lib/serialize";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  await connectToDatabase();
  const [productDoc, categoryDocs, collectionDocs] = await Promise.all([
    Product.findUnique({
      where: { id: id },
      include: { collections: { select: { collectionId: true } } },
    }),
    Category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    Collection.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  if (!productDoc) notFound();

  const product = toPlain<ProductFormValues & { category: string }>({
    ...productDoc,
    collections: productDoc.collections.map((item) => item.collectionId),
  });
  const categories = toPlain<{ id: string; name: string }[]>(categoryDocs);
  const collections = toPlain<{ id: string; title: string }[]>(collectionDocs);

  return (
    <div>
      <h2 className="text-sm text-ink">Edit product</h2>
      <div className="mt-6">
        <ProductForm categories={categories} collections={collections} initial={product} />
      </div>
    </div>
  );
}
