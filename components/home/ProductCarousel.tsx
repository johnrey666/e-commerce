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
    scroller.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  if (products.length === 0) return null;

  return (
    <section className="border-t border-ink/8 py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-10">
        <Reveal>
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">{title}</h2>
              {subtitle && <p className="section-sub">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Link href={href} className="btn-ghost mr-3 hidden sm:inline-flex">
                View All
              </Link>
              <button
                onClick={() => scrollBy(-1)}
                aria-label={`Scroll ${title} left`}
                className="grid size-10 place-items-center border border-ink/15 text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <ChevronLeftIcon width={14} height={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label={`Scroll ${title} right`}
                className="grid size-10 place-items-center border border-ink/15 text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-paper"
              >
                <ChevronRightIcon width={14} height={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </Reveal>

        <div
          ref={scroller}
          className="no-scrollbar -mx-5 flex snap-x gap-6 overflow-x-auto px-5 sm:-mx-10 sm:px-10"
        >
          {products.map((p, i) => (
            <Reveal
              key={p.id}
              delay={Math.min(i * 0.05, 0.2)}
              className="w-[13rem] shrink-0 snap-start sm:w-[16rem]"
            >
              <ProductCard product={p} brandName={brandName(p.brandId)} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
