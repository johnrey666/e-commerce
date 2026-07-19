"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CloseIcon, FilterIcon, SearchIcon } from "@/components/icons";
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

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];

function sortSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, undefined, { numeric: true });
}

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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const priceCeiling = useMemo(
    () =>
      Math.max(1000, ...products.map((p) => Math.ceil(effectivePrice(p) / 100) * 100)),
    [products]
  );

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) for (const s of p.sizes) set.add(s);
    return [...set].sort(sortSizes);
  }, [products]);

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
    if (selectedSizes.length > 0)
      list = list.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
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
  }, [products, section, query, selectedCategories, selectedBrands, selectedSizes, maxPrice, sort]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    selectedSizes.length +
    (maxPrice < priceCeiling ? 1 : 0);

  const heading =
    section === "new-arrivals"
      ? "New Arrivals"
      : section === "on-sale"
        ? "Private Sale"
        : "The Collection";

  const filterPanel = (
    <div className="space-y-9">
      <fieldset>
        <legend className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-ink/50">
          Category
        </legend>
        <div className="space-y-3">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex cursor-pointer items-center gap-3 text-[13px] text-ink/70 transition-colors hover:text-ink"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() =>
                  setSelectedCategories((prev) => toggle(prev, cat.id))
                }
                className="size-3.5 accent-ink"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-ink/50">
          House
        </legend>
        <div className="space-y-3">
          {brands.map((brand) => (
            <label
              key={brand.id}
              className="flex cursor-pointer items-center gap-3 text-[13px] text-ink/70 transition-colors hover:text-ink"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => setSelectedBrands((prev) => toggle(prev, brand.id))}
                className="size-3.5 accent-ink"
              />
              {brand.name}
            </label>
          ))}
        </div>
      </fieldset>

      {allSizes.length > 0 && (
        <fieldset>
          <legend className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-ink/50">
            Size
          </legend>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSizes((prev) => toggle(prev, size))}
                  aria-pressed={active}
                  className={`min-w-10 border px-3 py-2 text-[11px] font-medium tracking-[0.08em] transition-all duration-300 ${
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-ink/20 bg-transparent text-ink/70 hover:border-ink hover:text-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-4 text-[10px] font-medium uppercase tracking-[0.35em] text-ink/50">
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
          className="w-full accent-ink"
        />
        <div className="mt-2 flex justify-between text-[11px] tracking-[0.05em] text-ink/40">
          <span>₱100</span>
          <span className="font-medium text-ink">
            up to ₱{Math.min(maxPrice, priceCeiling).toLocaleString()}
          </span>
        </div>
      </fieldset>

      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            setSelectedCategories([]);
            setSelectedBrands([]);
            setSelectedSizes([]);
            setMaxPrice(priceCeiling);
          }}
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-14 sm:px-10 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-ink/10 pb-10 text-center"
      >
        <div className="rule-diamond mx-auto max-w-sm">
          <p className="eyebrow">Good Catch</p>
        </div>
        <h1 className="section-title mt-5">{heading}</h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-ink/40">
          {ready
            ? `${filtered.length} of ${products.length} pieces`
            : "Loading…"}
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon
            width={16}
            height={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the collection…"
            aria-label="Search products"
            className="w-full border border-ink/15 bg-surface py-3 pl-11 pr-4 text-[13px] text-ink outline-none transition-colors duration-300 placeholder:text-ink/30 focus:border-ink"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort products"
          className="border border-ink/15 bg-surface px-4 py-3 text-[13px] text-ink outline-none transition-colors duration-300 focus:border-ink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setFiltersOpen(true)}
          aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
          className="relative grid size-[46px] shrink-0 place-items-center border border-ink/15 bg-surface text-ink transition-colors duration-300 hover:border-ink lg:hidden"
        >
          <FilterIcon width={17} height={17} strokeWidth={1.5} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[230px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block" aria-label="Product filters">
          <div className="sticky top-32 border-r border-ink/8 pr-8">
            {filterPanel}
          </div>
        </aside>

        {/* Grid */}
        <div>
          {ready && filtered.length === 0 ? (
            <div className="grid place-items-center border border-ink/10 bg-surface py-28 text-center">
              <p className="font-display text-2xl font-medium text-ink">
                Nothing here — for now
              </p>
              <p className="mt-2 text-[13px] text-ink/45">
                Try widening your filters or searching something else.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, delay: (i % 8) * 0.03 }}
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
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] overflow-y-auto bg-paper p-7 lg:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
                  Refine
                </h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="grid size-9 place-items-center text-ink/60 hover:text-ink"
                >
                  <CloseIcon strokeWidth={1.5} />
                </button>
              </div>
              {filterPanel}
              <button
                onClick={() => setFiltersOpen(false)}
                className="btn-primary mt-10 w-full"
              >
                Show {filtered.length} pieces
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
