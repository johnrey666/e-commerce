"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand-logos";

/** Partner brands strip — admin-managed images, or bundled defaults when empty. */
export function HeroGallery({
  images = [],
  title = "Sourced from the world's finest brands",
}: {
  images?: string[];
  title?: string;
}) {
  const custom = images.filter(Boolean);
  const items =
    custom.length > 0
      ? custom.map((src) => ({ src }))
      : BRAND_LOGOS.map((logo) => ({ src: logo }));

  if (items.length === 0) return null;

  return (
    <div className="border-y border-ink/10 py-10">
      <p className="mb-8 text-center text-[9px] font-medium uppercase tracking-[0.45em] text-ink/35">
        {title}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 px-4">
        {items.map((item, idx) => (
          <motion.div
            key={typeof item.src === "string" ? `${item.src}-${idx}` : idx}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: idx * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative h-9 w-20 opacity-45 grayscale transition-all duration-500 hover:opacity-90 hover:grayscale-0 sm:h-11 sm:w-24"
          >
            <Image
              src={item.src}
              alt={`Partner brand ${idx + 1}`}
              fill
              sizes="120px"
              className="object-contain"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
