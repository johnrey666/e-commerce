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

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Products{" "}
          <span className="text-base font-medium text-muted">
            ({ready ? products.length : "…"})
          </span>
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          + Add product
        </Link>
      </div>

      <div className="relative mt-6 max-w-sm">
        <SearchIcon
          width={17}
          height={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-4 font-semibold">Product</th>
              <th className="px-5 py-4 font-semibold">Category / Brand</th>
              <th className="px-5 py-4 font-semibold">Price</th>
              <th className="px-5 py-4 font-semibold">Stock</th>
              <th className="px-5 py-4 font-semibold">Flags</th>
              <th className="px-5 py-4 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((p) => {
              const percent = discountPercent(p);
              return (
                <tr key={p.id} className="transition-colors hover:bg-cream/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage image={p.images[0]} alt="" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="font-medium hover:text-brand"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted">{p.condition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {categories.find((c) => c.id === p.categoryId)?.name ?? "—"}{" "}
                    · {brands.find((b) => b.id === p.brandId)?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold">
                      {formatPrice(effectivePrice(p))}
                    </span>
                    {percent != null && (
                      <span className="ml-1.5 text-xs text-brand">
                        -{percent}%
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        p.stock <= 1 ? "font-semibold text-brand" : undefined
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.isNewArrival && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          New
                        </span>
                      )}
                      <button
                        onClick={() => updateProduct(p.id, { onSale: !p.onSale })}
                        title="Toggle 'On Sale' feature flag"
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                          p.onSale
                            ? "bg-brand text-white"
                            : "bg-cream text-muted hover:text-ink"
                        }`}
                      >
                        Sale
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="rounded-full border border-line px-4 py-1.5 text-xs font-medium transition-colors hover:border-brand hover:text-brand"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        aria-label={`Delete ${p.name}`}
                        className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-brand-light hover:text-brand"
                      >
                        <TrashIcon width={15} height={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ready && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
