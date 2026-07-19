"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { SearchIcon, TrashIcon } from "@/components/icons";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/format";
import { useCatalog } from "@/lib/hooks";
import { useCatalogStore } from "@/lib/store/catalog-store";

export default function AdminProductsPage() {
  const { products, brands, categories, ready } = useCatalog();
  const deleteProduct = useCatalogStore((s) => s.deleteProduct);
  const updateProduct = useCatalogStore((s) => s.updateProduct);
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Could not delete product."
        );
      }
    }
  };

  const toggleSale = async (id: string, onSale: boolean) => {
    try {
      await updateProduct(id, { onSale: !onSale });
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not update product."
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The Rack</p>
          <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
            Products
            <span className="ml-3 align-middle text-base font-normal text-ink/40">
              {ready ? products.length : "…"}
            </span>
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary !px-8 !py-3.5">
          Add Product
        </Link>
      </div>

      <div className="relative mt-8 max-w-sm">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="input-field !pl-11"
        />
      </div>

      {ready && products.length === 0 ? (
        <div className="mt-10 border border-ink/10 bg-surface px-6 py-20 text-center">
          <p className="eyebrow">Empty Rack</p>
          <p className="mt-4 font-display text-2xl font-medium text-ink">
            No products yet
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink/45">
            Your catalog is empty and ready for real inventory. Add your first
            piece to see it live in the store.
          </p>
          <Link
            href="/admin/products/new"
            className="btn-secondary mt-8 !px-8 !py-3.5"
          >
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-ink/10 bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-[9px] uppercase tracking-[0.25em] text-ink/45">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category / Brand</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock</th>
                <th className="px-6 py-4 font-medium">Flags</th>
                <th className="px-6 py-4 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8">
              {filtered.map((p) => {
                const percent = discountPercent(p);
                return (
                  <tr key={p.id} className="transition-colors hover:bg-brand-faint">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-11 shrink-0 overflow-hidden border border-ink/10 bg-brand-soft">
                          <ProductImage image={p.images[0]} alt="" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="font-medium text-ink transition-colors hover:text-brand"
                          >
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                            {p.condition}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-ink/55">
                      {categories.find((c) => c.id === p.categoryId)?.name ?? "—"}{" "}
                      · {brands.find((b) => b.id === p.brandId)?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-ink">
                        {formatPrice(effectivePrice(p))}
                      </span>
                      {percent != null && (
                        <span className="ml-1.5 text-xs text-brand">
                          -{percent}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={
                          p.stock <= 1
                            ? "font-semibold text-brand"
                            : "text-ink/70"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {p.isNewArrival && (
                          <span className="bg-ink px-2 py-1 text-[8px] font-medium uppercase tracking-[0.2em] text-white">
                            New
                          </span>
                        )}
                        <button
                          onClick={() => void toggleSale(p.id, p.onSale)}
                          title="Toggle 'On Sale' feature flag"
                          className={`px-2 py-1 text-[8px] font-medium uppercase tracking-[0.2em] transition-colors ${
                            p.onSale
                              ? "bg-brand text-white"
                              : "border border-ink/15 text-ink/40 hover:border-ink hover:text-ink"
                          }`}
                        >
                          Sale
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="border border-ink/15 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60 transition-all duration-300 hover:border-ink hover:text-ink"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => void handleDelete(p.id, p.name)}
                          aria-label={`Delete ${p.name}`}
                          className="grid size-8 place-items-center text-ink/35 transition-colors hover:bg-brand-soft hover:text-brand"
                        >
                          <TrashIcon width={15} height={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ready && products.length > 0 && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-[13px] text-ink/45">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
