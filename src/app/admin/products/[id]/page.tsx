export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { toPlain } from "@/lib/serialize";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  await connectToDatabase();
  const [productDoc, categoryDocs] = await Promise.all([
    Product.findById(id).lean(),
    Category.find().sort({ name: 1 }).select("name").lean(),
  ]);

  if (!productDoc) notFound();

  const product = toPlain<ProductFormValues & { category: string }>(productDoc);
  const categories = toPlain<{ _id: string; name: string }[]>(categoryDocs);

  return (
    <div>
      <h2 className="text-sm text-ink">Edit product</h2>
      <div className="mt-6">
        <ProductForm categories={categories} initial={product} />
      </div>
    </div>
  );
}
