"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useCatalog } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { useCatalogStore } from "@/lib/store/catalog-store";
import type { Product, ProductCondition } from "@/lib/types";

const CONDITIONS: ProductCondition[] = [
  "Brand New",
  "Like New",
  "Excellent",
  "Good",
  "Fair",
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
  categoryIds: string[];
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
    categoryIds: product?.categoryIds ?? [],
    brandId: product?.brandId ?? "",
    condition: product?.condition ?? "Good",
    images: product?.images ?? [],
    sizes: product?.sizes.join(", ") ?? "",
    stock: product?.stock.toString() ?? "1",
    tags: product?.tags.join(", ") ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCategory = (id: string) =>
    set(
      "categoryIds",
      form.categoryIds.includes(id)
        ? form.categoryIds.filter((categoryId) => categoryId !== id)
        : [...form.categoryIds, id]
    );

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;

    setImageError(null);
    setUploading(true);

    try {
      const selected = Array.from(files);
      const invalid = selected.find(
        (file) =>
          !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
            file.type
          ) || file.size > 8 * 1024 * 1024
      );

      if (invalid) {
        throw new Error(
          "Use JPG, PNG, WebP, or AVIF images up to 8 MB each."
        );
      }

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Your admin session expired. Please sign in again.");
      }

      const urls: string[] = [];

      for (const file of selected) {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            cacheControl: "31536000",
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        urls.push(data.publicUrl);
      }

      setForm((current) => ({
        ...current,
        images: [...current.images, ...urls],
      }));
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "Image upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (form.images.length === 0) {
      setImageError("Upload at least one product image.");
      return;
    }
    if (form.categoryIds.length === 0) {
      setSaveError("Select at least one category.");
      return;
    }

    const csv = (s: string) =>
      s.split(",").map((x) => x.trim()).filter(Boolean);

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      onSale: form.onSale,
      isNewArrival: form.isNewArrival,
      categoryIds: form.categoryIds,
      brandId: form.brandId,
      condition: form.condition,
      images: form.images,
      sizes: csv(form.sizes),
      stock: Number(form.stock),
      tags: csv(form.tags),
    };

    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.id, data);
      } else {
        await addProduct(data);
      }
      router.push("/admin/products");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save product."
      );
    } finally {
      setSaving(false);
    }
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
          <fieldset>
            <legend className={labelClass}>Categories *</legend>
            <p className="-mt-1 mb-3 text-[12px] text-ink/45">
              Select as many as needed. Choose from both departments to show
              this product under Men and Women.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories
                .filter((c) => c.parentId === null)
                .map((parent) => (
                  <div
                    key={parent.id}
                    className="border border-ink/10 bg-paper p-4"
                  >
                    <p className="mb-3 font-display text-base font-medium text-ink">
                      {parent.name}
                    </p>
                    <div className="space-y-2.5">
                      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/70">
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(parent.id)}
                          onChange={() => toggleCategory(parent.id)}
                          className="size-3.5 accent-ink"
                        />
                        General
                      </label>
                      {categories
                        .filter((c) => c.parentId === parent.id)
                        .map((category) => (
                          <label
                            key={category.id}
                            className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/70"
                          >
                            <input
                              type="checkbox"
                              checked={form.categoryIds.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                              className="size-3.5 accent-ink"
                            />
                            {category.name}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
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
            <span className="ml-1 font-normal text-ink/40">
              (auto-clears after 10 days)
            </span>
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
          Upload up to 8 MB per image. The first image becomes the product
          cover.
        </p>
        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-ink/25 px-6 py-10 text-center transition-colors hover:border-brand hover:bg-brand-faint">
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-ink/65">
            {uploading ? "Uploading…" : "Choose Images"}
          </span>
          <span className="mt-2 text-xs text-ink/40">
            JPG, PNG, WebP, or AVIF · multiple files allowed
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={(event) => {
              void uploadImages(event.target.files);
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>

        {imageError && (
          <p role="alert" className="mt-4 text-sm font-medium text-brand">
            {imageError}
          </p>
        )}

        {form.images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((image, index) => (
              <div
                key={image}
                className="group relative aspect-[3/4] overflow-hidden border border-ink/10 bg-brand-soft"
              >
                <ProductImage image={image} alt={`Product image ${index + 1}`} />
                {index === 0 && (
                  <span className="absolute left-2 top-2 bg-paper/95 px-2 py-1 text-[8px] font-medium uppercase tracking-[0.2em] text-ink">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "images",
                      form.images.filter((item) => item !== image)
                    )
                  }
                  className="absolute right-2 top-2 grid size-8 place-items-center bg-ink/80 text-lg leading-none text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove product image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-[11px] leading-relaxed text-ink/40">
          Removing an image here removes it from this product. Uploaded files
          remain in Supabase Storage.
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
        {saveError && (
          <p role="alert" className="w-full text-sm font-medium text-brand">
            {saveError}
          </p>
        )}
        <motion.button
          type="submit"
          disabled={uploading || saving}
          whileTap={{ scale: 0.98 }}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : product
              ? "Save Changes"
              : "Add Product"}
        </motion.button>
        <Link href="/admin/products" className="btn-secondary !border-ink/20 !text-ink/60 hover:!border-ink hover:!bg-ink">
          Cancel
        </Link>
      </div>
    </form>
  );
}
