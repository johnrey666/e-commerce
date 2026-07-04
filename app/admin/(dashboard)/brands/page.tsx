"use client";

import { NamedListManager } from "@/components/admin/NamedListManager";
import { useCatalog } from "@/lib/hooks";
import { useCatalogStore } from "@/lib/store/catalog-store";

export default function AdminBrandsPage() {
  const { products, brands, ready } = useCatalog();
  const addBrand = useCatalogStore((s) => s.addBrand);
  const updateBrand = useCatalogStore((s) => s.updateBrand);
  const deleteBrand = useCatalogStore((s) => s.deleteBrand);

  if (!ready) {
    return <p className="py-12 text-center text-sm text-muted">Loading…</p>;
  }

  return (
    <NamedListManager
      title="Brands"
      description="Brands added here feed the brand filter on the shop page."
      items={brands}
      usageCount={(id) => products.filter((p) => p.brandId === id).length}
      onAdd={addBrand}
      onUpdate={updateBrand}
      onDelete={deleteBrand}
    />
  );
}
