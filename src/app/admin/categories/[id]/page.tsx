export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { toPlain } from "@/lib/serialize";
import { CategoryForm, CategoryFormValues } from "@/components/admin/CategoryForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;

  await connectToDatabase();
  const categoryDoc = await Category.findUnique({ where: { id: id } });
  if (!categoryDoc) notFound();
  const categories = toPlain<{ id: string; name: string }[]>(
    await Category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  );

  const category = toPlain<CategoryFormValues>({
    ...categoryDoc,
    filters: toPlain<CategoryFormValues["filters"]>(categoryDoc.filters),
  });

  return (
    <div>
      <h2 className="text-sm text-ink">Edit category</h2>
      <div className="mt-6">
        <CategoryForm initial={category} categories={categories} />
      </div>
    </div>
  );
}
