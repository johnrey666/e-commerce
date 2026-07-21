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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 40;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE
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
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search products…"
          aria-label="Search products"
          className="input-field !pl-11 text-base"
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
      ) : ready && filtered.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-ink/45">
          No products match your search.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paged.map((p) => {
            const percent = discountPercent(p);
            const brandName = brands.find((b) => b.id === p.brandId)?.name;
            const categoryLabel =
              categories
                .filter((c) => p.categoryIds.includes(c.id))
                .map((c) => c.name)
                .join(", ") || "—";

            return (
              <li
                key={p.id}
                className="group/card flex flex-col overflow-hidden border border-ink/10 bg-surface"
              >
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="relative aspect-[3/4] overflow-hidden bg-brand-soft"
                >
                  <ProductImage
                    image={p.images[0]}
                    alt={p.name}
                    className="[&_img]:transition-transform [&_img]:duration-700 [&_img]:group-hover/card:scale-[1.03]"
                  />
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {p.stock <= 0 && (
                      <span className="bg-brand px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-white">
                        Sold Out
                      </span>
                    )}
                    {p.isNewArrival && (
                      <span className="bg-ink px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-white">
                        New
                      </span>
                    )}
                    {percent != null && (
                      <span className="bg-accent px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.16em] text-white">
                        −{percent}%
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col px-2.5 py-3 sm:px-3">
                  <p className="truncate text-[9px] uppercase tracking-[0.18em] text-ink/40">
                    {brandName ?? "—"}
                  </p>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="mt-1 line-clamp-2 font-display text-[14px] font-medium leading-snug text-ink hover:text-brand"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 truncate text-[10px] text-ink/40">
                    {categoryLabel}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <p className="font-display text-[15px] font-medium text-ink">
                      {formatPrice(effectivePrice(p))}
                    </p>
                    <p
                      className={`text-[10px] uppercase tracking-[0.14em] ${
                        p.stock <= 1 ? "font-semibold text-brand" : "text-ink/40"
                      }`}
                    >
                      Stock {p.stock}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-1.5 pt-3">
                    <button
                      type="button"
                      onClick={() => void toggleSale(p.id, p.onSale)}
                      className={`flex-1 py-2 text-[8px] font-medium uppercase tracking-[0.18em] transition-colors ${
                        p.onSale
                          ? "bg-brand text-white"
                          : "border border-ink/15 text-ink/45 hover:border-ink hover:text-ink"
                      }`}
                    >
                      Sale
                    </button>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="flex-1 border border-ink/15 py-2 text-center text-[8px] font-medium uppercase tracking-[0.18em] text-ink/55 hover:border-ink hover:text-ink"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(p.id, p.name)}
                      aria-label={`Delete ${p.name}`}
                      className="grid size-8 shrink-0 place-items-center text-ink/30 hover:bg-brand-soft hover:text-brand"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {ready && filtered.length > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between border-t border-ink/8 pt-4">
          <button
            type="button"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-[10px] text-ink/35">
            {pageSafe} / {totalPages}
          </span>
          <button
            type="button"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
