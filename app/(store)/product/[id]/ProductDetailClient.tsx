"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Reveal } from "@/components/Reveal";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/format";
import { useCatalog } from "@/lib/hooks";
import { useCartStore } from "@/lib/store/cart-store";

export function ProductDetailClient({ id }: { id: string }) {
  const { products, brands, categories, ready } = useCatalog();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const product = products.find((p) => p.id === id);
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [added, setAdded] = useState(false);

  if (!ready) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-32 text-center text-[11px] uppercase tracking-[0.3em] text-ink/40 sm:px-10">
        Loading…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[90rem] px-5 py-32 text-center sm:px-10">
        <h1 className="font-display text-3xl font-medium text-ink">
          This piece got away
        </h1>
        <p className="mt-3 text-[13px] text-ink/50">
          The item you&apos;re looking for doesn&apos;t exist or has been sold.
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          Back to the Collection
        </Link>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === product.brandId);
  const productCategories = categories.filter((c) =>
    product.categoryIds.includes(c.id)
  );
  const categoryNames = productCategories.map((c) => c.name).join(", ");
  const primaryCategory = productCategories[0];
  const percent = discountPercent(product);
  const soldOut = product.stock <= 0;
  const chosenSize = size ?? product.sizes[0];

  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categoryIds.some((id) => product.categoryIds.includes(id))
    )
    .slice(0, 4);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: effectivePrice(product),
      image: product.images[0] ?? "placeholder:neutral",
      size: chosenSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openDrawer();
  };

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-12 pb-28 sm:px-10 md:pb-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em] text-ink/45 transition-colors duration-300 hover:text-ink"
      >
        <ChevronLeftIcon width={13} height={13} strokeWidth={1.5} />
        The Collection
      </Link>

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="aspect-[4/5] overflow-hidden bg-brand-soft">
            <ProductImage
              image={product.images[imageIndex]}
              alt={`${product.name} — photo ${imageIndex + 1}`}
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View photo ${i + 1} of ${product.name}`}
                  className={`h-24 w-20 overflow-hidden border transition-all duration-300 ${
                    i === imageIndex
                      ? "border-ink"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <ProductImage image={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:pt-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            {brand && (
              <Link
                href={`/shop?brand=${brand.id}`}
                className="text-[10px] font-medium uppercase tracking-[0.35em] text-ink/45 transition-colors hover:text-ink"
              >
                {brand.name}
              </Link>
            )}
            {product.isNewArrival && (
              <span className="border border-ink/20 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.25em] text-ink/70">
                New In
              </span>
            )}
            {percent != null && (
              <span className="bg-accent px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.25em] text-white">
                −{percent}%
              </span>
            )}
          </div>

          <h1 className="mt-4 font-display text-[2.4rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-xl tracking-[0.04em] text-ink">
              {formatPrice(effectivePrice(product))}
            </span>
            {percent != null && (
              <span className="text-base text-ink/35 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="mt-7 h-px w-16 bg-ink/15" />

          <p className="mt-7 max-w-md text-[14px] leading-[1.8] text-ink/60">
            {product.description}
          </p>

          <dl className="mt-9 grid grid-cols-3 divide-x divide-ink/10 border-y border-ink/10 py-5 text-center">
            <div className="px-2">
              <dt className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/40">
                Condition
              </dt>
              <dd className="mt-1.5 text-[13px] font-medium text-ink">
                {product.condition}
              </dd>
            </div>
            <div className="px-2">
              <dt className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/40">
                Category
              </dt>
              <dd className="mt-1.5 text-[13px] font-medium text-ink">
                {categoryNames || "—"}
              </dd>
            </div>
            <div className="px-2">
              <dt className="text-[8px] font-medium uppercase tracking-[0.3em] text-ink/40">
                Availability
              </dt>
              <dd className="mt-1.5 text-[13px] font-medium text-ink">
                {soldOut ? "Sold" : "One of one"}
              </dd>
            </div>
          </dl>

          {product.sizes.length > 0 && (
            <fieldset className="mt-9">
              <legend className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-ink/50">
                Size
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={chosenSize === s}
                    className={`min-w-12 border px-5 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-all duration-300 ${
                      chosenSize === s
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/20 bg-transparent text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-10">
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className={`w-full py-5 text-[11px] font-medium uppercase tracking-[0.32em] transition-all duration-500 sm:max-w-sm ${
                soldOut
                  ? "cursor-not-allowed bg-ink/15 text-ink/40"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {soldOut ? "Sold" : added ? "Added to Bag" : "Add to Bag"}
            </button>
            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink/40">
              Complimentary delivery · GCash at checkout
            </p>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-[0.2em] text-ink/35"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile sticky add-to-bag bar — sits above the bottom tab bar */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 z-30 border-t border-ink/10 bg-white/95 px-5 py-3.5 backdrop-blur-xl md:hidden"
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-medium leading-tight text-ink">
              {product.name}
            </p>
            <p className="mt-0.5 text-[12px] tracking-[0.06em] text-ink/60">
              {formatPrice(effectivePrice(product))}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className={`shrink-0 px-7 py-3.5 text-[10px] font-medium uppercase tracking-[0.25em] transition-colors duration-300 ${
              soldOut
                ? "cursor-not-allowed bg-ink/15 text-ink/40"
                : "bg-brand text-white active:bg-brand-dark"
            }`}
          >
            {soldOut ? "Sold" : added ? "Added" : "Add to Bag"}
          </button>
        </div>
      </motion.div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-24 border-t border-ink/8 pt-16 sm:mt-32">
          <Reveal>
            <div className="mb-12 text-center">
              <div className="rule-diamond mx-auto max-w-sm">
                <p className="eyebrow">Complete the Look</p>
              </div>
              <h2 className="section-title mt-5">
                More {primaryCategory?.name ?? "Pieces"}
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-4 sm:gap-x-6">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <ProductCard
                  product={p}
                  brandName={brands.find((b) => b.id === p.brandId)?.name}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
