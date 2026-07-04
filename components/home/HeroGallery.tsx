"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { HERO_LOGO_TILES } from "@/lib/brand-logos";

/** Hero bento — 6 brand logos; blogo4 fills the landscape (2×1) tile. */
export function HeroGallery() {
  return (
    <div className="grid h-[320px] grid-cols-3 grid-rows-3 gap-2 sm:h-[340px] sm:gap-2.5">
      {HERO_LOGO_TILES.map(({ logo, className, label }, idx) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.05 + idx * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{ scale: 1.015 }}
          className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-brand/8 bg-white p-2.5 sm:rounded-2xl sm:p-3 ${className}`}
        >
          <Image
            src={logo}
            alt={label}
            width={logo.width}
            height={logo.height}
            className="h-auto max-h-[85%] w-auto max-w-[90%] object-contain"
          />
        </motion.div>
      ))}
    </div>
  );
}
