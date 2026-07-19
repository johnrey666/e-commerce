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

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55";

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
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <section className="border border-ink/10 bg-surface p-7 sm:p-8">
        <p className="eyebrow">01</p>
        <h2 className="mb-6 mt-2 font-display text-xl font-medium text-ink">
          Basics
        </h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name *
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="input-field"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="categoryId" className={labelClass}>
                Category *
              </label>
              <select
                id="categoryId"
                required
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="input-field"
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
              <label htmlFor="brandId" className={labelClass}>
                Brand *
              </label>
              <select
                id="brandId"
                required
                value={form.brandId}
                onChange={(e) => set("brandId", e.target.value)}
                className="input-field"
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
              <label htmlFor="condition" className={labelClass}>
                Condition *
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => set("condition", e.target.value as ProductCondition)}
                className="input-field"
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

      <section className="border border-ink/10 bg-surface p-7 sm:p-8">
        <p className="eyebrow">02</p>
        <h2 className="mb-6 mt-2 font-display text-xl font-medium text-ink">
          Pricing &amp; Stock
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className={labelClass}>
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
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="discountPrice" className={labelClass}>
              Discount price (₱)
            </label>
            <input
              id="discountPrice"
              type="number"
              min={0}
              step={1}
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="stock" className={labelClass}>
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
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink/70">
            <input
              type="checkbox"
              checked={form.onSale}
              onChange={(e) => set("onSale", e.target.checked)}
              className="size-4 accent-[#c1121f]"
            />
            Feature under &quot;On Sale&quot;
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink/70">
            <input
              type="checkbox"
              checked={form.isNewArrival}
              onChange={(e) => set("isNewArrival", e.target.checked)}
              className="size-4 accent-[#c1121f]"
            />
            New Arrival
          </label>
        </div>
        {form.onSale && !form.discountPrice && (
          <p className="mt-4 text-xs text-brand">
            Tip: set a discount price so the sale badge shows a percentage.
          </p>
        )}
      </section>

      <section className="border border-ink/10 bg-surface p-7 sm:p-8">
        <p className="eyebrow">03</p>
        <h2 className="mt-2 font-display text-xl font-medium text-ink">
          Images
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/45">
          Pick one or more placeholder swatches for now — real image upload
          plugs in with the Supabase backend.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {PLACEHOLDER_HUES.map((hue) => {
            const selected = form.images.includes(`placeholder:${hue}`);
            return (
              <button
                key={hue}
                type="button"
                onClick={() => toggleImage(hue)}
                aria-pressed={selected}
                aria-label={`${hue} placeholder image`}
                className={`h-14 w-11 overflow-hidden border-2 transition-all ${
                  selected ? "scale-105 border-brand" : "border-transparent"
                }`}
              >
                <ProductImage image={`placeholder:${hue}`} alt="" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="border border-ink/10 bg-surface p-7 sm:p-8">
        <p className="eyebrow">04</p>
        <h2 className="mb-6 mt-2 font-display text-xl font-medium text-ink">
          Variants &amp; Tags
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="sizes" className={labelClass}>
              Sizes{" "}
              <span className="normal-case tracking-normal text-ink/35">
                (comma-separated)
              </span>
            </label>
            <input
              id="sizes"
              placeholder="S, M, L"
              value={form.sizes}
              onChange={(e) => set("sizes", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags{" "}
              <span className="normal-case tracking-normal text-ink/35">
                (comma-separated)
              </span>
            </label>
            <input
              id="tags"
              placeholder="vintage, streetwear"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
        >
          {product ? "Save Changes" : "Add Product"}
        </motion.button>
        <Link href="/admin/products" className="btn-secondary !border-ink/20 !text-ink/60 hover:!border-ink hover:!bg-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
