"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/format";
import { cartRoomForProduct, useCartStore } from "@/lib/store/cart-store";
import type { Product } from "@/lib/types";
import { PlusIcon } from "./icons";
import { ProductImage } from "./ProductImage";

export function ProductCard({
  product,
  brandName,
  index = 0,
}: {
  product: Product;
  brandName?: string;
  index?: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const cartItems = useCartStore((s) => s.items);
  const percent = discountPercent(product);
  const soldOut = product.stock <= 0;
  const atCartMax =
    !soldOut && cartRoomForProduct(cartItems, product.id, product.stock) <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut || atCartMax) return;
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: effectivePrice(product),
      image: product.images[0] ?? "",
      size: product.sizes[0],
      stock: product.stock,
    });
    openDrawer();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.6, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group/card"
    >
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-[3/4] overflow-hidden bg-brand-soft"
      >
        <ProductImage
          image={product.images[0]}
          alt={product.name}
          className="[&_img]:transition-transform [&_img]:duration-[1200ms] [&_img]:ease-out [&_img]:group-hover/card:scale-[1.05]"
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNewArrival && (
            <span className="bg-paper/95 px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.25em] text-ink">
              New In
            </span>
          )}
          {percent != null && (
            <span className="bg-accent px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.25em] text-white">
              −{percent}%
            </span>
          )}
        </div>

        {!soldOut && !atCartMax && (
          <>
            {/* Desktop — slide-up bar on hover */}
            <button
              onClick={quickAdd}
              aria-label={`Add ${product.name}`}
              className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-brand/95 py-3.5 text-[10px] font-medium uppercase tracking-[0.3em] text-white backdrop-blur-sm transition-transform duration-500 ease-out hover:bg-brand-dark group-hover/card:translate-y-0 sm:block"
            >
              Add to Bag
            </button>
            {/* Mobile — always-visible quiet quick-add */}
            <button
              onClick={quickAdd}
              aria-label={`Add ${product.name}`}
              className="absolute bottom-2.5 right-2.5 grid size-9 place-items-center border border-white/40 bg-white/85 text-brand shadow-sm backdrop-blur-sm transition-colors active:bg-brand active:text-white sm:hidden"
            >
              <PlusIcon width={15} height={15} strokeWidth={1.5} />
            </button>
          </>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/70 backdrop-blur-[2px]">
            <span className="border border-ink/30 px-4 py-2 text-[9px] font-medium uppercase tracking-[0.3em] text-ink/60">
              Sold
            </span>
          </div>
        )}
      </Link>

      <div className="mt-4 space-y-1.5 text-center">
        {brandName && (
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
            {brandName}
          </p>
        )}
        <Link
          href={`/product/${product.id}`}
          className="block font-display text-[17px] font-medium leading-snug text-ink transition-colors duration-300 hover:text-accent"
        >
          <span className="line-clamp-1">{product.name}</span>
        </Link>
        <div className="flex items-baseline justify-center gap-2.5">
          <span className="text-[12px] tracking-[0.08em] text-ink/75">
            {formatPrice(effectivePrice(product))}
          </span>
          {percent != null && (
            <span className="text-[11px] tracking-[0.05em] text-ink/30 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
