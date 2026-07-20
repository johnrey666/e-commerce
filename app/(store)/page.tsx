"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { HeroGallery } from "@/components/home/HeroGallery";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { fadeUp, Reveal } from "@/components/Reveal";
import { useCatalog, useLandingContent } from "@/lib/hooks";
import { scatteredSample } from "@/lib/sample-images";
import { curatedSections } from "@/lib/seed-data";
import type { CuratedSection, Product } from "@/lib/types";

const HoodieViewer = dynamic(
  () =>
    import("@/components/home/HoodieViewer").then((m) => m.HoodieViewer),
  { ssr: false }
);

function sectionProducts(section: CuratedSection, products: Product[]) {
  switch (section.filter) {
    case "new-arrivals":
      return products.filter((p) => p.isNewArrival);
    case "on-sale":
      return products.filter((p) => p.onSale);
    default:
      return products;
  }
}

export default function HomePage() {
  const { products, brands, categories, ready } = useCatalog();
  const { content } = useLandingContent();
  const subcategoryGroups = Array.from(
    categories
      .filter((category) => category.parentId !== null)
      .reduce((groups, category) => {
        const key = category.name.trim().toLowerCase();
        const existing = groups.get(key);
        if (existing) {
          existing.ids.push(category.id);
        } else {
          groups.set(key, { name: category.name, ids: [category.id] });
        }
        return groups;
      }, new Map<string, { name: string; ids: string[] }>())
      .values()
  );

  return (
    <div className="bg-paper">
      {/* ——— Hero — full-bleed video ——— */}
      <section className="relative overflow-hidden bg-ink">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          src={content.heroVideoUrl}
        />
        {/* Legibility veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/35 to-ink/60" />

        <div className="relative z-10 mx-auto flex h-[82svh] max-w-3xl flex-col items-center justify-center px-6 text-center sm:h-[72vh] lg:h-[82vh]">
          <motion.p
            {...fadeUp}
            className="text-[10px] font-medium uppercase tracking-[0.4em] text-white/65"
          >
            Est. Manila · One of One
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="mt-7 font-display text-[3rem] font-medium leading-[1.05] tracking-[-0.01em] text-white sm:text-[4.25rem] lg:text-[5rem]"
          >
            Rare pieces,
            <br />
            <em className="font-normal italic text-white/85">
              quietly curated.
            </em>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
            className="mx-auto mt-7 max-w-md text-[14px] leading-relaxed tracking-[0.02em] text-white/70"
          >
            A private edit of vintage apparel — each piece hand-selected,
            authenticated, and delivered to your door. When it&apos;s gone,
            it&apos;s gone.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.24 }}
            className="mt-10 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center sm:gap-4"
          >
            <span className="btn-running-glow inline-flex w-full sm:w-auto">
              <Link
                href="/shop"
                className="inline-flex w-full items-center justify-center bg-white px-10 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-ink transition-all duration-500 ease-out hover:bg-brand hover:text-white active:scale-[0.99] sm:w-auto"
              >
                Explore the Collection
              </Link>
            </span>
            <Link
              href="/shop?section=new-arrivals"
              className="inline-flex w-full items-center justify-center border border-white/50 px-10 py-4 text-[11px] font-medium uppercase tracking-[0.28em] text-white transition-all duration-500 ease-out hover:border-white hover:bg-white hover:text-ink active:scale-[0.99] sm:w-auto"
            >
              New Arrivals
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ——— Partner brands strip ——— */}
      <section className="mx-auto mt-20 max-w-[90rem] px-5 sm:mt-28 sm:px-10">
        <HeroGallery images={content.brandImages} />
      </section>

      {/* ——— New arrivals, then on sale ——— */}
      {ready &&
        curatedSections.map((section) => (
          <ProductCarousel
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            href={`/shop?section=${section.filter}`}
            products={sectionProducts(section, products).slice(0, 2)}
            brands={brands}
          />
        ))}

      {/* ——— Categories ——— */}
      <section className="border-t border-ink/8 py-20 sm:py-28">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-10">
          <Reveal>
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="eyebrow">Departments</p>
                <h2 className="section-title mt-4">Shop by Category</h2>
              </div>
              <Link href="/shop" className="btn-ghost hidden sm:inline-flex">
                View All
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
            {(ready ? subcategoryGroups : []).map((group, i) => {
              const count = products.filter((p) =>
                p.categoryIds.some((id) => group.ids.includes(id))
              ).length;
              const img =
                group.ids
                  .map((id) => content.categoryImages[id])
                  .find(Boolean) || scatteredSample(i + 3);
              return (
                <Reveal key={group.name.toLowerCase()} delay={i * 0.05}>
                  <Link
                    href={`/shop?category=${group.ids.join(",")}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-brand-soft"
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="220px"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent transition-opacity duration-500 group-hover:from-ink/80" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-center">
                      <p className="font-display text-lg font-medium text-paper">
                        {group.name}
                      </p>
                      <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-paper/60">
                        {count} {count === 1 ? "piece" : "pieces"}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Manifesto ——— */}
      <section className="relative overflow-hidden border-t border-ink/8 bg-ink py-24 sm:py-32">
        <HoodieViewer />
        <div className="pointer-events-none relative z-10 mx-auto max-w-2xl px-5 text-center sm:px-10">
          <Reveal>
            <p className="text-[9px] font-medium uppercase tracking-[0.45em] text-paper/40">
              The Brand Philosophy
            </p>
            <p className="mt-8 font-display text-2xl font-medium leading-relaxed text-paper sm:text-[1.75rem]">
              &ldquo;Luxury is not about more.
              <br />
              <em className="font-normal italic text-paper/70">
                It&apos;s about the one that cannot be repeated.
              </em>
              &rdquo;
            </p>
            <div className="mx-auto mt-8 h-px w-12 bg-paper/25" />
            <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-paper/40">
              Good Catch · Curated Vintage
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
