export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import { toPlain } from "@/lib/serialize";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await connectToDatabase();
  const [categoryDocs, collectionDocs] = await Promise.all([
    Category.find().sort({ name: 1 }).select("name").lean(),
    Collection.find().sort({ title: 1 }).select("title").lean(),
  ]);
  const categories = toPlain<{ _id: string; name: string }[]>(categoryDocs);
  const collections = toPlain<{ _id: string; title: string }[]>(collectionDocs);

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
