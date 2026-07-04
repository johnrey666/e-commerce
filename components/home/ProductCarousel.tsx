"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "../ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { Reveal } from "../Reveal";
import type { Brand, Product } from "@/lib/types";

export function ProductCarousel({
  title,
  subtitle,
  href,
  products,
  brands,
}: {
  title: string;
  subtitle?: string;
  href: string;
  products: Product[];
  brands: Brand[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name;

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  if (products.length === 0) return null;

  return (
    <section className="border-t border-brand/10 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{title}</h2>
              {subtitle && <p className="section-sub">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Link href={href} className="btn-ghost mr-2 hidden sm:inline-flex">
                View all →
              </Link>
              <button
                onClick={() => scrollBy(-1)}
                aria-label={`Scroll ${title} left`}
                className="grid size-9 place-items-center rounded-full border border-brand/15 text-brand transition-all duration-200 hover:border-brand hover:bg-brand-soft"
              >
                <ChevronLeftIcon width={15} height={15} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label={`Scroll ${title} right`}
                className="grid size-9 place-items-center rounded-full border border-brand/15 text-brand transition-all duration-200 hover:border-brand hover:bg-brand-soft"
              >
                <ChevronRightIcon width={15} height={15} />
              </button>
            </div>
          </div>
        </Reveal>

        <div
          ref={scroller}
          className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
        >
            {products.map((p, i) => (
            <Reveal
              key={p.id}
              delay={Math.min(i * 0.05, 0.2)}
              className="w-[11rem] shrink-0 snap-start sm:w-[14rem]"
            >
              <ProductCard product={p} brandName={brandName(p.brandId)} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
