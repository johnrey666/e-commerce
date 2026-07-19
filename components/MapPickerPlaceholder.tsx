"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { PinIcon } from "./icons";

/**
 * Placeholder "Pin Location" picker. Clicking the map drops a pin and emits
 * pseudo-coordinates. Swap this for Leaflet or a Google Maps embed later —
 * keep the `onPin(location: string)` contract.
 */
export function MapPickerPlaceholder({
  onPin,
}: {
  onPin: (location: string) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPin({ x, y });
    // Fake coordinates around Metro Manila for the placeholder.
    const lat = (14.4 + (1 - y / 100) * 0.4).toFixed(4);
    const lng = (120.9 + (x / 100) * 0.3).toFixed(4);
    onPin(`${lat}, ${lng}`);
  };

  return (
    <div>
      <button
        type="button"
        ref={ref}
        onClick={handleClick}
        aria-label="Pin your location on the map (placeholder)"
        className="relative block h-44 w-full cursor-crosshair overflow-hidden border border-ink/12 bg-[linear-gradient(#efece4_1px,transparent_1px),linear-gradient(90deg,#efece4_1px,transparent_1px)] bg-white bg-[size:24px_24px]"
      >
        {/* decorative "roads" */}
        <span className="absolute left-0 top-1/3 h-1.5 w-full bg-brand-soft" aria-hidden />
        <span className="absolute left-1/4 top-0 h-full w-1.5 bg-brand-soft" aria-hidden />
        <span className="absolute left-2/3 top-0 h-full w-1 rotate-12 bg-brand-soft" aria-hidden />

        {pin ? (
          <motion.span
            initial={{ scale: 0, y: -16 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute -translate-x-1/2 -translate-y-full text-accent"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <PinIcon width={30} height={30} strokeWidth={1.5} />
          </motion.span>
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[11px] uppercase tracking-[0.2em] text-ink/35">
            Tap anywhere to pin your location
          </span>
        )}
      </button>
      <p className="mt-2 text-[11px] text-ink/35">
        Map placeholder — a real map picker (Leaflet / Google Maps) plugs in here.
      </p>
    </div>
  );
}
