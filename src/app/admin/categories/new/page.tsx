import { CategoryForm } from "@/components/admin/CategoryForm";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { toPlain } from "@/lib/serialize";

export default async function NewCategoryPage() {
  await connectToDatabase();
  const categories = toPlain<{ id: string; name: string }[]>(
    await Category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  );

  return (
    <div>
      <h2 className="text-sm text-ink">New category</h2>
      <div className="mt-6">
        <CategoryForm categories={categories} />
      </div>
    </div>
  );
}
