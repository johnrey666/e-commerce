"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { ProductCard } from "@/components/ProductCard";
import { effectivePrice } from "@/lib/format";
import { useCatalog } from "@/lib/hooks";

type SortKey = "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
];

export function ShopClient() {
  const searchParams = useSearchParams();
  const { products, brands, categories, ready } = useCatalog();

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const c = searchParams.get("category");
    return c ? [c] : [];
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? [b] : [];
  });
  const section = searchParams.get("section"); // new-arrivals | on-sale
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const priceCeiling = useMemo(
    () =>
      Math.max(1000, ...products.map((p) => Math.ceil(effectivePrice(p) / 100) * 100)),
    [products]
  );

  const filtered = useMemo(() => {
    let list = [...products];

    if (section === "new-arrivals") list = list.filter((p) => p.isNewArrival);
    if (section === "on-sale") list = list.filter((p) => p.onSale);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategories.length > 0)
      list = list.filter((p) => selectedCategories.includes(p.categoryId));
    if (selectedBrands.length > 0)
      list = list.filter((p) => selectedBrands.includes(p.brandId));
    list = list.filter((p) => effectivePrice(p) <= maxPrice);

    switch (sort) {
      case "newest":
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "price-asc":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return list;
  }, [products, section, query, selectedCategories, selectedBrands, maxPrice, sort]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (maxPrice < priceCeiling ? 1 : 0);

  const heading =
    section === "new-arrivals"
      ? "New Arrivals"
      : section === "on-sale"
        ? "On Sale"
        : "All Finds";

  const filterPanel = (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 font-display text-sm font-bold uppercase tracking-wide">
          Category
        </legend>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() =>
                  setSelectedCategories((prev) => toggle(prev, cat.id))
                }
                className="size-4 rounded accent-brand"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-sm font-bold uppercase tracking-wide">
          Brand
        </legend>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label
              key={brand.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => setSelectedBrands((prev) => toggle(prev, brand.id))}
                className="size-4 rounded accent-brand"
              />
              {brand.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-display text-sm font-bold uppercase tracking-wide">
          Max price
        </legend>
        <input
          type="range"
          min={100}
          max={priceCeiling}
          step={50}
          value={Math.min(maxPrice, priceCeiling)}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum price"
          className="w-full accent-brand"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>₱100</span>
          <span className="font-semibold text-brand">
            up to ₱{Math.min(maxPrice, priceCeiling).toLocaleString()}
          </span>
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            setSelectedCategories([]);
            setSelectedBrands([]);
            setMaxPrice(priceCeiling);
          }}
          className="text-sm font-medium text-brand hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-line/60 pb-8"
      >
        <p className="eyebrow">Shop</p>
        <h1 className="section-title mt-2">{heading}</h1>
        <p className="mt-2 text-sm font-medium text-muted">
          {ready ? `${filtered.length} of ${products.length} items on the rack` : "Loading…"}
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon
            width={17}
            height={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tag…"
            aria-label="Search products"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort products"
          className="rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setFiltersOpen(true)}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand lg:hidden"
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-24 rounded-2xl border border-line/70 bg-surface p-6 shadow-card">
            {filterPanel}
          </div>
        </aside>

        {/* Grid */}
        <div>
          {ready && filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-line/70 bg-surface py-24 text-center shadow-card">
              <p className="font-display text-lg font-bold">No catches here</p>
              <p className="mt-1 text-sm text-muted">
                Try widening your filters or searching something else.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, delay: (i % 8) * 0.03 }}
                  >
                    <ProductCard
                      product={p}
                      index={i}
                      brandName={brands.find((b) => b.id === p.brandId)?.name}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-6 shadow-lift lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="grid size-9 place-items-center rounded-full hover:bg-cream"
                >
                  <CloseIcon />
                </button>
              </div>
              {filterPanel}
              <button
                onClick={() => setFiltersOpen(false)}
                className="mt-8 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Show {filtered.length} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
