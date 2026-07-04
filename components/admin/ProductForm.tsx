"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCatalog } from "@/lib/hooks";
import { useCatalogStore } from "@/lib/store/catalog-store";
import type { Product, ProductCondition } from "@/lib/types";

const CONDITIONS: ProductCondition[] = [
  "Brand New",
  "Like New",
  "Excellent",
  "Good",
  "Fair",
];

const PLACEHOLDER_HUES = [
  "slate", "zinc", "gray", "neutral", "stone", "red", "rose",
  "orange", "amber", "yellow", "lime", "emerald", "teal", "blue", "indigo",
];

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand";

interface FormState {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  onSale: boolean;
  isNewArrival: boolean;
  categoryId: string;
  brandId: string;
  condition: ProductCondition;
  images: string[];
  sizes: string;
  stock: string;
  tags: string;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { brands, categories, ready } = useCatalog();
  const addProduct = useCatalogStore((s) => s.addProduct);
  const updateProduct = useCatalogStore((s) => s.updateProduct);

  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price.toString() ?? "",
    discountPrice: product?.discountPrice?.toString() ?? "",
    onSale: product?.onSale ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    categoryId: product?.categoryId ?? "",
    brandId: product?.brandId ?? "",
    condition: product?.condition ?? "Good",
    images: product?.images ?? ["placeholder:neutral"],
    sizes: product?.sizes.join(", ") ?? "",
    stock: product?.stock.toString() ?? "1",
    tags: product?.tags.join(", ") ?? "",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleImage = (hue: string) => {
    const ref = `placeholder:${hue}`;
    setForm((f) => ({
      ...f,
      images: f.images.includes(ref)
        ? f.images.filter((i) => i !== ref)
        : [...f.images, ref],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const csv = (s: string) =>
      s.split(",").map((x) => x.trim()).filter(Boolean);

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      onSale: form.onSale,
      isNewArrival: form.isNewArrival,
      categoryId: form.categoryId,
      brandId: form.brandId,
      condition: form.condition,
      images: form.images.length > 0 ? form.images : ["placeholder:neutral"],
      sizes: csv(form.sizes),
      stock: Number(form.stock),
      tags: csv(form.tags),
    };

    if (product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    router.push("/admin/products");
  };

  if (!ready) {
    return <p className="py-12 text-center text-sm text-muted">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">Basics</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Name *
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium">
                Category *
              </label>
              <select
                id="categoryId"
                required
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brandId" className="mb-1.5 block text-sm font-medium">
                Brand *
              </label>
              <select
                id="brandId"
                required
                value={form.brandId}
                onChange={(e) => set("brandId", e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select…
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="mb-1.5 block text-sm font-medium">
                Condition *
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => set("condition", e.target.value as ProductCondition)}
                className={inputClass}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">Pricing & stock</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
              Price (₱) *
            </label>
            <input
              id="price"
              required
              type="number"
              min={0}
              step={1}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="discountPrice" className="mb-1.5 block text-sm font-medium">
              Discount price (₱)
            </label>
            <input
              id="discountPrice"
              type="number"
              min={0}
              step={1}
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="stock" className="mb-1.5 block text-sm font-medium">
              Stock *
            </label>
            <input
              id="stock"
              required
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.onSale}
              onChange={(e) => set("onSale", e.target.checked)}
              className="size-4 rounded accent-[#e63946]"
            />
            Feature under &quot;On Sale&quot;
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isNewArrival}
              onChange={(e) => set("isNewArrival", e.target.checked)}
              className="size-4 rounded accent-[#e63946]"
            />
            New Arrival
          </label>
        </div>
        {form.onSale && !form.discountPrice && (
          <p className="mt-3 text-xs text-brand">
            Tip: set a discount price so the sale badge shows a percentage.
          </p>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Images</h2>
        <p className="mt-1 text-sm text-muted">
          Upload placeholder — pick one or more placeholder swatches for now.
          Real image upload plugs in with the backend.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PLACEHOLDER_HUES.map((hue) => {
            const selected = form.images.includes(`placeholder:${hue}`);
            return (
              <button
                key={hue}
                type="button"
                onClick={() => toggleImage(hue)}
                aria-pressed={selected}
                aria-label={`${hue} placeholder image`}
                className={`h-14 w-11 overflow-hidden rounded-lg border-2 transition-all ${
                  selected ? "scale-105 border-brand" : "border-transparent"
                }`}
              >
                <ProductImage image={`placeholder:${hue}`} alt="" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold">Variants & tags</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sizes" className="mb-1.5 block text-sm font-medium">
              Sizes <span className="font-normal text-muted">(comma-separated)</span>
            </label>
            <input
              id="sizes"
              placeholder="S, M, L"
              value={form.sizes}
              onChange={(e) => set("sizes", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="tags" className="mb-1.5 block text-sm font-medium">
              Tags <span className="font-normal text-muted">(comma-separated)</span>
            </label>
            <input
              id="tags"
              placeholder="vintage, streetwear"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="rounded-full bg-brand px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {product ? "Save changes" : "Add product"}
        </motion.button>
        <Link
          href="/admin/products"
          className="rounded-full border border-line px-8 py-3 font-semibold transition-colors hover:border-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
