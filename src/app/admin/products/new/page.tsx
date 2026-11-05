export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import { toPlain } from "@/lib/serialize";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await connectToDatabase();
  const [categoryDocs, collectionDocs] = await Promise.all([
    Category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    Collection.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  const categories = toPlain<{ id: string; name: string }[]>(categoryDocs);
  const collections = toPlain<{ id: string; title: string }[]>(collectionDocs);

  return (
    <div>
      <h2 className="text-sm text-ink">New product</h2>
      <div className="mt-6">
        {categories.length === 0 ? (
          <p className="text-sm text-stone">
            Create a category first — products need one to belong to.
          </p>
        ) : (
          <ProductForm categories={categories} collections={collections} />
        )}
      </div>
    </div>
  );
}
