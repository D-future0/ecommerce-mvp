export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { toPlain } from "@/lib/serialize";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await connectToDatabase();
  const categoryDocs = await Category.find().sort({ name: 1 }).select("name").lean();
  const categories = toPlain<{ _id: string; name: string }[]>(categoryDocs);

  return (
    <div>
      <h2 className="text-sm text-ink">New product</h2>
      <div className="mt-6">
        {categories.length === 0 ? (
          <p className="text-sm text-stone">
            Create a category first — products need one to belong to.
          </p>
        ) : (
          <ProductForm categories={categories} />
        )}
      </div>
    </div>
  );
}
