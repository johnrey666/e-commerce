"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart-store";
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
  const percent = discountPercent(product);
  const soldOut = product.stock <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: effectivePrice(product),
      image: product.images[0] ?? "",
      size: product.sizes[0],
    });
    openDrawer();
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group/card"
    >
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-brand-soft"
      >
        <ProductImage
          image={product.images[0]}
          alt={product.name}
          className="[&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out [&_img]:group-hover/card:scale-[1.04]"
        />

        <div className="absolute left-2.5 top-2.5 flex gap-1">
          {product.isNewArrival && (
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand shadow-sm">
              New
            </span>
          )}
          {percent != null && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              −{percent}%
            </span>
          )}
        </div>

        {!soldOut && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={quickAdd}
            aria-label={`Add ${product.name}`}
            className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white text-brand opacity-0 shadow-md transition-opacity duration-300 group-hover/card:opacity-100"
          >
            <PlusIcon width={16} height={16} />
          </motion.button>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand/40">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <div className="mt-3.5 space-y-1">
        {brandName && (
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand/35">
            {brandName}
          </p>
        )}
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-1 text-[14px] font-medium text-brand-dark transition-colors duration-200 hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-semibold text-brand">
            {formatPrice(effectivePrice(product))}
          </span>
          {percent != null && (
            <span className="text-xs text-brand/30 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
