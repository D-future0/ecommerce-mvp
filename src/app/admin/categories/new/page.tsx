import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <h2 className="text-sm text-ink">New category</h2>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
