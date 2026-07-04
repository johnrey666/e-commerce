"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { CartIcon, ChevronLeftIcon } from "@/components/icons";
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
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-muted sm:px-6">
        Loading…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">
          This catch got away
        </h1>
        <p className="mt-2 text-muted">
          The item you&apos;re looking for doesn&apos;t exist or has been sold.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand px-8 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === product.brandId);
  const category = categories.find((c) => c.id === product.categoryId);
  const percent = discountPercent(product);
  const soldOut = product.stock <= 0;
  const chosenSize = size ?? product.sizes[0];

  const related = products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-brand"
      >
        <ChevronLeftIcon width={16} height={16} />
        Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-white shadow-card">
            <ProductImage
              image={product.images[imageIndex]}
              alt={`${product.name} — photo ${imageIndex + 1}`}
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View photo ${i + 1} of ${product.name}`}
                  className={`h-20 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                    i === imageIndex ? "border-brand" : "border-transparent"
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <div className="flex flex-wrap items-center gap-2">
            {brand && (
              <Link
                href={`/shop?brand=${brand.id}`}
                className="text-sm font-semibold uppercase tracking-wider text-muted hover:text-brand"
              >
                {brand.name}
              </Link>
            )}
            {product.isNewArrival && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                New
              </span>
            )}
            {percent != null && (
              <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold uppercase text-white">
                -{percent}%
              </span>
            )}
          </div>

          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-brand">
              {formatPrice(effectivePrice(product))}
            </span>
            {percent != null && (
              <span className="text-lg text-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-muted">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 shadow-card">
              <dt className="text-xs text-muted">Condition</dt>
              <dd className="mt-0.5 font-semibold">{product.condition}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card">
              <dt className="text-xs text-muted">Category</dt>
              <dd className="mt-0.5 font-semibold">{category?.name ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card">
              <dt className="text-xs text-muted">Stock</dt>
              <dd className="mt-0.5 font-semibold">
                {soldOut ? "Sold out" : `${product.stock} left`}
              </dd>
            </div>
          </dl>

          {product.sizes.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-semibold">Size</legend>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={chosenSize === s}
                    className={`min-w-12 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                      chosenSize === s
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white hover:border-brand hover:text-brand"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8">
            <motion.button
              whileHover={soldOut ? undefined : { scale: 1.02 }}
              whileTap={soldOut ? undefined : { scale: 0.97 }}
              onClick={handleAdd}
              disabled={soldOut}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full py-4 font-semibold text-white transition-colors sm:w-auto sm:px-12 ${
                soldOut
                  ? "cursor-not-allowed bg-muted"
                  : "bg-brand hover:bg-brand-dark"
              }`}
            >
              <CartIcon width={18} height={18} />
              {soldOut ? "Sold out" : added ? "Added!" : "Add to cart"}
            </motion.button>
            <p className="mt-3 text-xs text-muted">
              Delivery included · pay via GCash at checkout
            </p>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">
              More from {category?.name ?? "this rack"}
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
