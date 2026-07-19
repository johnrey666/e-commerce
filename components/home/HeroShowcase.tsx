"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice, effectivePrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/** Editorial featured row — four quiet, gallery-like tiles. */
export function HeroShowcase({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.stock > 0).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-6">
      {featured.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href={`/product/${p.id}`} className="group block">
            <div className="relative aspect-[3/4] overflow-hidden bg-brand-soft">
              <ProductImage
                image={p.images[0]}
                alt={p.name}
                className="[&_img]:transition-transform [&_img]:duration-[1200ms] [&_img]:group-hover:scale-105"
              />
              {p.isNewArrival && (
                <span className="absolute left-2.5 top-2.5 bg-paper/95 px-2 py-1 text-[7px] font-medium uppercase tracking-[0.25em] text-ink">
                  New In
                </span>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="line-clamp-1 font-display text-[15px] font-medium text-ink transition-colors duration-300 group-hover:text-accent">
                {p.name}
              </p>
              <p className="mt-1 text-[11px] tracking-[0.08em] text-ink/60">
                {formatPrice(effectivePrice(p))}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
