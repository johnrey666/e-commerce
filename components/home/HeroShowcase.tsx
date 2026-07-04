"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice, effectivePrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/** Compact featured row — small cards, not a giant hero tile. */
export function HeroShowcase({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.stock > 0).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {featured.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={`/product/${p.id}`}
            className="group block overflow-hidden rounded-xl border border-brand/8 bg-white transition-colors duration-200 hover:border-brand/25"
          >
            <div className="relative aspect-[3/4] max-h-[160px] overflow-hidden bg-brand-soft sm:max-h-[180px]">
              <ProductImage
                image={p.images[0]}
                alt={p.name}
                className="[&_img]:transition-transform [&_img]:duration-500 [&_img]:group-hover:scale-105"
              />
              {p.isNewArrival && (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
              )}
            </div>
            <div className="px-2.5 py-2 sm:px-3 sm:py-2.5">
              <p className="line-clamp-1 text-[11px] font-medium text-brand-dark group-hover:text-brand sm:text-xs">
                {p.name}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-brand sm:text-[11px]">
                {formatPrice(effectivePrice(p))}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
