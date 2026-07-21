"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Reveal } from "@/components/Reveal";
import { useLandingContent } from "@/lib/hooks";
import inside1 from "@/lib/images/inside1.jpg";
import inside2 from "@/lib/images/inside2.jpg";
import inside3 from "@/lib/images/inside3.jpg";
import inside4 from "@/lib/images/inside4.jpg";
import inside5 from "@/lib/images/inside5.jpg";
import inside6 from "@/lib/images/inside6.jpg";
import storefront from "@/lib/images/storefront.jpg";
import { DEFAULT_STORE_INFO } from "@/lib/site-content";

const FALLBACK_INTERIOR: StaticImageData[] = [
  inside1,
  inside2,
  inside3,
  inside4,
  inside5,
  inside6,
];

const ease = [0.22, 1, 0.36, 1] as const;

export function StoreInfo() {
  const { content } = useLandingContent();
  const info = content.storeInfo ?? DEFAULT_STORE_INFO;

  const exteriorSrc: string | StaticImageData =
    info.exteriorUrl || storefront;

  const interiorSrcs = useMemo(() => {
    const custom = (info.interiorUrls ?? []).filter(Boolean);
    if (custom.length > 0) return custom;
    return FALLBACK_INTERIOR;
  }, [info.interiorUrls]);

  const details =
    info.details?.length > 0 ? info.details : DEFAULT_STORE_INFO.details;

  const [inside, setInside] = useState(false);
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + interiorSrcs.length) % interiorSrcs.length);
  }, [interiorSrcs.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % interiorSrcs.length);
  }, [interiorSrcs.length]);

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

  useEffect(() => {
    if (index >= interiorSrcs.length) setIndex(0);
  }, [interiorSrcs.length, index]);

  return (
    <section className="border-t border-ink/8 bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-10">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">{info.eyebrow || "Visit Us"}</p>
            <h2 className="section-title mt-4">{info.title || "Store Info"}</h2>
            <p className="section-sub mx-auto">
              {info.subtitle || DEFAULT_STORE_INFO.subtitle}
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
                      src={exteriorSrc}
                      alt="Good Catch storefront"
                      fill
                      priority={false}
                      sizes="(max-width: 1440px) 100vw, 1440px"
                      className="object-cover object-center"
                      {...(typeof exteriorSrc !== "string"
                        ? { placeholder: "blur" as const }
                        : {})}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-5 pb-8 pt-16 sm:pb-10">
                      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-paper/70">
                        {info.tagline || DEFAULT_STORE_INFO.tagline}
                      </p>
                      {interiorSrcs.length > 0 && (
                        <button
                          type="button"
                          onClick={stepInside}
                          className="btn-primary min-w-[12rem] shadow-[0_12px_40px_-12px_rgba(193,18,31,0.55)]"
                        >
                          Step Inside
                        </button>
                      )}
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
                          src={interiorSrcs[index]}
                          alt={`Inside Good Catch — photo ${index + 1}`}
                          fill
                          sizes="(max-width: 1440px) 100vw, 1440px"
                          className="object-cover object-center"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div
                      className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/25"
                      aria-hidden
                    />

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
                        {String(interiorSrcs.length).padStart(2, "0")}
                      </p>
                    </div>

                    {interiorSrcs.length > 1 && (
                      <>
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
                      </>
                    )}

                    {interiorSrcs.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6 sm:pb-6">
                        <div className="mx-auto flex max-w-md justify-center gap-2 sm:gap-2.5">
                          {interiorSrcs.map((shot, i) => (
                            <button
                              key={typeof shot === "string" ? shot : i}
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
                                src={shot}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-12 grid gap-8 border-t border-ink/8 pt-10 sm:mt-14 sm:grid-cols-3 sm:gap-6 sm:pt-12">
            {details.map((item) => {
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

              if (item.href) {
                return (
                  <a
                    key={`${item.label}-${item.value}`}
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
                <div
                  key={`${item.label}-${item.value}`}
                  className="text-center sm:text-left"
                >
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
