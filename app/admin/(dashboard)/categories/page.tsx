"use client";

import { NamedListManager } from "@/components/admin/NamedListManager";
import { useCatalog } from "@/lib/hooks";
import { useCatalogStore } from "@/lib/store/catalog-store";

export default function AdminCategoriesPage() {
  const { products, categories, ready } = useCatalog();
  const addCategory = useCatalogStore((s) => s.addCategory);
  const updateCategory = useCatalogStore((s) => s.updateCategory);
  const deleteCategory = useCatalogStore((s) => s.deleteCategory);

  if (!ready) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  return (
    <NamedListManager
      title="Categories"
      eyebrow="Departments"
      description="Categories power the shop filters and homepage shortcuts."
      items={categories}
      usageCount={(id) => products.filter((p) => p.categoryId === id).length}
      onAdd={addCategory}
      onUpdate={updateCategory}
      onDelete={deleteCategory}
    />
  );
}
