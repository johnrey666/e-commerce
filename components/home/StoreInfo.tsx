"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import inside1 from "@/lib/images/inside1.jpg";
import inside2 from "@/lib/images/inside2.jpg";
import inside3 from "@/lib/images/inside3.jpg";
import inside4 from "@/lib/images/inside4.jpg";
import inside5 from "@/lib/images/inside5.jpg";
import inside6 from "@/lib/images/inside6.jpg";
import storefront from "@/lib/images/storefront.jpg";

const INTERIOR: { src: StaticImageData; alt: string }[] = [
  { src: inside1, alt: "Inside Good Catch — racks and curated pieces" },
  { src: inside2, alt: "Inside Good Catch — vintage apparel display" },
  { src: inside3, alt: "Inside Good Catch — store interior" },
  { src: inside4, alt: "Inside Good Catch — clothing rails" },
  { src: inside5, alt: "Inside Good Catch — floor view" },
  { src: inside6, alt: "Inside Good Catch — shop atmosphere" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const DETAILS = [
  {
    label: "Hours",
    value: "Mon – Sun",
    detail: "10:00 AM – 8:00 PM",
  },
  {
    label: "Location",
    value: "Legazpi City",
    detail: "Peñaranda St, Albay",
    href: "https://maps.app.goo.gl/WoB33D1QXzXSSpdH6",
  },
  {
    label: "Social",
    value: "@goodcatch",
    detail: "Instagram & Facebook",
    href: "https://www.facebook.com/goodcatch.ph",
  },
] as const;

export function StoreInfo() {
  const [inside, setInside] = useState(false);
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + INTERIOR.length) % INTERIOR.length);
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % INTERIOR.length);
  }, []);

  const stepInside = () => {
    setIndex(0);
    setInside(true);
  };

  const stepOutside = () => {
    setInside(false);
  };

  useEffect(() => {
    if (!inside) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") stepOutside();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inside, goPrev, goNext]);

  return (
    <section className="border-t border-ink/8 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-10">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">Visit Us</p>
            <h2 className="section-title mt-4">Store Info</h2>
            <p className="section-sub mx-auto">
              Cool people like thrifting — step through the door and see the
              floor.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-12 sm:mt-16">
          <div className="relative overflow-hidden bg-brand-soft">
            <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/10]">
              <AnimatePresence mode="wait" initial={false}>
                {!inside ? (
                  <motion.div
                    key="outside"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.55, ease }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={storefront}
                      alt="Good Catch storefront on Peñaranda Street"
                      fill
                      priority={false}
                      sizes="(max-width: 1440px) 100vw, 1440px"
                      className="object-cover object-center"
                      placeholder="blur"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-5 pb-8 pt-16 sm:pb-10">
                      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-paper/70">
                        Buy · Sell · Trade · Consign
                      </p>
                      <button
                        type="button"
                        onClick={stepInside}
                        className="btn-primary min-w-[12rem] shadow-[0_12px_40px_-12px_rgba(193,18,31,0.55)]"
                      >
                        Step Inside
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inside"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.55, ease }}
                    className="absolute inset-0"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={INTERIOR[index].src}
                          alt={INTERIOR[index].alt}
                          fill
                          sizes="(max-width: 1440px) 100vw, 1440px"
                          className="object-cover object-center"
                          placeholder="blur"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/25"
                      aria-hidden
                    />

                    {/* Top bar */}
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
                      <button
                        type="button"
                        onClick={stepOutside}
                        className="text-[10px] font-medium uppercase tracking-[0.28em] text-paper/85 transition-colors hover:text-paper"
                      >
                        ← Back Outside
                      </button>
                      <p className="tabular-nums text-[10px] font-medium uppercase tracking-[0.28em] text-paper/70">
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {String(INTERIOR.length).padStart(2, "0")}
                      </p>
                    </div>

                    {/* Nav arrows */}
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous interior photo"
                      className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center border border-paper/35 bg-ink/35 text-paper backdrop-blur-sm transition-colors hover:border-paper hover:bg-ink/55 sm:left-5 sm:size-11"
                    >
                      <ChevronLeftIcon width={18} height={18} />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next interior photo"
                      className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center border border-paper/35 bg-ink/35 text-paper backdrop-blur-sm transition-colors hover:border-paper hover:bg-ink/55 sm:right-5 sm:size-11"
                    >
                      <ChevronRightIcon width={18} height={18} />
                    </button>

                    {/* Thumbnails */}
                    <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6 sm:pb-6">
                      <div className="mx-auto flex max-w-md justify-center gap-2 sm:gap-2.5">
                        {INTERIOR.map((shot, i) => (
                          <button
                            key={shot.alt}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`View interior photo ${i + 1}`}
                            aria-current={i === index}
                            className={`relative aspect-[3/4] w-10 overflow-hidden transition-all duration-300 sm:w-12 ${
                              i === index
                                ? "opacity-100 ring-1 ring-paper"
                                : "opacity-45 hover:opacity-80"
                            }`}
                          >
                            <Image
                              src={shot.src}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-12 grid gap-8 border-t border-ink/8 pt-10 sm:mt-14 sm:grid-cols-3 sm:gap-6 sm:pt-12">
            {DETAILS.map((item) => {
              const body = (
                <>
                  <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">
                    {item.label}
                  </p>
                  <p className="mt-3 font-display text-xl font-medium text-ink sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-[13px] tracking-[0.01em] text-ink/45">
                    {item.detail}
                  </p>
                </>
              );

              if ("href" in item && item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center transition-colors hover:text-brand sm:text-left"
                  >
                    {body}
                  </a>
                );
              }

              return (
                <div key={item.label} className="text-center sm:text-left">
                  {body}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
