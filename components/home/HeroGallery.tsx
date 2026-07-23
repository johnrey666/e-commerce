"use client";

import Image from "next/image";

/** Partner brands strip — infinite logo loop (admin-uploaded only). */
export function HeroGallery({
  images = [],
  title = "Sourced from the world's finest brands",
}: {
  images?: string[];
  title?: string;
}) {
  const items = images.filter(Boolean);
  if (items.length === 0) return null;

  // Duplicate enough times for a seamless marquee on wide screens.
  const loop = items.length === 1 ? [...items, ...items, ...items, ...items] : [...items, ...items];

  return (
    <div className="border-y border-ink/10 py-10">
      <p className="mb-8 text-center text-[9px] font-medium uppercase tracking-[0.45em] text-ink/35">
        {title}
      </p>

      <div className="group relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-paper to-transparent sm:w-20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-paper to-transparent sm:w-20"
          aria-hidden
        />

        <div className="flex w-max animate-logo-marquee gap-x-14 px-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-x-20">
          {loop.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative h-9 w-20 shrink-0 opacity-45 grayscale transition-all duration-500 hover:opacity-90 hover:grayscale-0 sm:h-11 sm:w-24"
            >
              <Image
                src={src}
                alt={
                  idx < items.length
                    ? `Partner brand ${idx + 1}`
                    : ""
                }
                fill
                sizes="120px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
