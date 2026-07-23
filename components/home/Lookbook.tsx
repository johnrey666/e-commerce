"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

function Frame({
  src,
  className = "",
  sizes,
  delay = 0,
}: {
  src: string;
  className?: string;
  sizes: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`relative overflow-hidden bg-brand-soft ${className}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.03]"
      />
    </motion.div>
  );
}

/** Campaign lookbook — asymmetric mosaic of model photos (no product links). */
export function Lookbook({
  images = [],
  title = "The look",
  embedded = false,
}: {
  images?: string[];
  title?: string;
  /** When true, drop outer section chrome (admin live preview). */
  embedded?: boolean;
}) {
  const items = images.filter(Boolean).slice(0, 5);
  if (items.length === 0) return null;

  const [a, b, c, d, e] = items;

  const body = (
    <>
      {!embedded && (
        <Reveal>
          <div className="mb-12 max-w-xl">
            <p className="eyebrow">Campaign</p>
            <h2 className="section-title mt-4">{title}</h2>
            <p className="section-sub">
              Quiet frames from the floor — the pieces as they live.
            </p>
          </div>
        </Reveal>
      )}

      {embedded && (
        <p className="mb-6 text-center text-[9px] font-medium uppercase tracking-[0.45em] text-ink/35">
          {title}
        </p>
      )}

      {items.length === 1 && (
        <Frame
          src={a}
          className="aspect-[16/10] w-full sm:aspect-[21/9]"
          sizes="100vw"
        />
      )}

      {items.length === 2 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
          <Frame src={a} className="aspect-[3/4]" sizes="50vw" />
          <Frame src={b!} className="aspect-[3/4]" sizes="50vw" delay={0.08} />
        </div>
      )}

      {items.length === 3 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-12">
          <Frame
            src={a}
            className="col-span-2 aspect-[4/5] md:col-span-7 md:aspect-auto md:min-h-[32rem] lg:min-h-[38rem]"
            sizes="(max-width: 768px) 100vw, 58vw"
          />
          <div className="col-span-2 grid grid-cols-2 gap-3 sm:gap-5 md:col-span-5 md:grid-cols-1 md:grid-rows-2 md:min-h-[32rem] lg:min-h-[38rem]">
            <Frame
              src={b!}
              className="aspect-[3/4] md:aspect-auto md:h-full md:min-h-0"
              sizes="(max-width: 768px) 50vw, 42vw"
              delay={0.08}
            />
            <Frame
              src={c!}
              className="aspect-[3/4] md:aspect-auto md:h-full md:min-h-0"
              sizes="(max-width: 768px) 50vw, 42vw"
              delay={0.14}
            />
          </div>
        </div>
      )}

      {items.length === 4 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <Frame src={a} className="aspect-[3/4]" sizes="50vw" />
          <Frame src={b!} className="aspect-[3/4]" sizes="50vw" delay={0.06} />
          <Frame src={c!} className="aspect-[3/4]" sizes="50vw" delay={0.12} />
          <Frame src={d!} className="aspect-[3/4]" sizes="50vw" delay={0.18} />
        </div>
      )}

      {items.length === 5 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-12">
          <Frame
            src={a}
            className="col-span-2 aspect-[4/5] md:col-span-6 md:row-span-2 md:aspect-auto md:min-h-[34rem] lg:min-h-[40rem]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <Frame
            src={b!}
            className="aspect-[3/4] md:col-span-3 md:aspect-auto md:min-h-[16.5rem] lg:min-h-[19.5rem]"
            sizes="(max-width: 768px) 50vw, 25vw"
            delay={0.06}
          />
          <Frame
            src={c!}
            className="aspect-[3/4] md:col-span-3 md:aspect-auto md:min-h-[16.5rem] lg:min-h-[19.5rem]"
            sizes="(max-width: 768px) 50vw, 25vw"
            delay={0.1}
          />
          <Frame
            src={d!}
            className="aspect-[3/4] md:col-span-3 md:aspect-auto md:min-h-[16.5rem] lg:min-h-[19.5rem]"
            sizes="(max-width: 768px) 50vw, 25vw"
            delay={0.14}
          />
          <Frame
            src={e!}
            className="aspect-[3/4] md:col-span-3 md:aspect-auto md:min-h-[16.5rem] lg:min-h-[19.5rem]"
            sizes="(max-width: 768px) 50vw, 25vw"
            delay={0.18}
          />
        </div>
      )}

      {!embedded && (
        <Reveal>
          <div className="mt-12 flex justify-center sm:mt-14">
            <Link href="/shop" className="btn-secondary">
              Explore the Collection
            </Link>
          </div>
        </Reveal>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return (
    <section className="border-t border-ink/8 py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-10">{body}</div>
    </section>
  );
}
