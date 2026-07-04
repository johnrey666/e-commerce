"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HeroGallery } from "@/components/home/HeroGallery";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { fadeUp, Reveal } from "@/components/Reveal";
import { useCatalog } from "@/lib/hooks";
import { scatteredSample } from "@/lib/sample-images";
import { curatedSections } from "@/lib/seed-data";
import type { CuratedSection, Product } from "@/lib/types";

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

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <motion.p {...fadeUp} className="eyebrow">
              Thrifted · delivered
            </motion.p>

            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="mt-4 text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.03em] text-brand-dark sm:text-5xl lg:text-[3.5rem]"
            >
              Curated secondhand,
              <br />
              <span className="text-brand">delivered.</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-5 max-w-sm text-[15px] leading-relaxed text-brand/45"
            >
              One-of-one shirts, pants, hoodies and more. Order online, pay
              via GCash, delivered to your door.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/shop" className="btn-primary">
                Shop now
              </Link>
              <Link href="/shop?section=new-arrivals" className="btn-secondary">
                New arrivals
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2"
          >
            <HeroGallery />
          </motion.div>
        </div>

        {ready && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="mt-12 border-t border-brand/8 pt-8"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="eyebrow">Featured</p>
              <Link href="/shop?section=new-arrivals" className="btn-ghost text-xs">
                See all →
              </Link>
            </div>
            <HeroShowcase products={products} />
          </motion.div>
        )}
      </section>

      {/* Categories */}
      <section className="border-t border-brand/8 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="eyebrow">Categories</p>
                <h2 className="section-title mt-2">Shop by type</h2>
              </div>
              <Link href="/shop" className="btn-ghost hidden sm:inline-flex">
                View all →
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3">
            {(ready ? categories : []).map((cat, i) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const img = scatteredSample(i + 3);
              return (
                <Reveal key={cat.id} delay={i * 0.04}>
                  <Link
                    href={`/shop?category=${cat.id}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-brand/8 bg-brand-soft"
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/75 via-brand-dark/10 to-transparent transition-opacity duration-300 group-hover:from-brand-dark/85" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-sm font-semibold text-white">{cat.name}</p>
                      <p className="mt-0.5 text-[11px] text-white/65">
                        {count} items
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {ready &&
        curatedSections.map((section) => (
          <ProductCarousel
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            href={`/shop?section=${section.filter}`}
            products={sectionProducts(section, products)}
            brands={brands}
          />
        ))}

      {ready && brands.length > 0 && (
        <section className="border-t border-brand/8 py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <p className="eyebrow">Brands</p>
              <h2 className="section-title mt-2">On the rack</h2>
            </Reveal>
            <div className="mt-7 flex flex-wrap gap-2">
              {brands.map((b, i) => (
                <Reveal key={b.id} delay={i * 0.03}>
                  <Link
                    href={`/shop?brand=${b.id}`}
                    className="rounded-full border border-brand/12 px-5 py-2 text-[13px] font-medium text-brand/55 transition-all duration-200 hover:border-brand hover:text-brand"
                  >
                    {b.name}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
