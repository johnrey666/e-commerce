"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand-logos";

/** Understated strip of partner maisons — grayscale until hover. */
export function HeroGallery() {
  return (
    <div className="border-y border-ink/10 py-10">
      <p className="mb-8 text-center text-[9px] font-medium uppercase tracking-[0.45em] text-ink/35">
        Sourced from the world&apos;s finest houses
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 px-4">
        {BRAND_LOGOS.map((logo, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-9 w-20 opacity-45 grayscale transition-all duration-500 hover:opacity-90 hover:grayscale-0 sm:h-11 sm:w-24"
          >
            <Image
              src={logo}
              alt={`Partner house ${idx + 1}`}
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
