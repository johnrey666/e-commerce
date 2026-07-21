"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PinIcon } from "./icons";

const MapInner = dynamic(() => import("./MapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-56 w-full place-items-center border border-ink/12 bg-cream text-[11px] uppercase tracking-[0.2em] text-ink/35">
      Loading map…
    </div>
  ),
});

/**
 * Interactive map pin picker (Leaflet / OpenStreetMap).
 * Emits `"lat, lng"` via onPin — same contract as the old placeholder.
 */
export function MapPicker({
  onPin,
  initialPin,
}: {
  onPin: (location: string) => void;
  initialPin?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="grid h-56 w-full place-items-center border border-ink/12 bg-cream text-[11px] uppercase tracking-[0.2em] text-ink/35">
        Loading map…
      </div>
    );
  }

  return (
    <div>
      <MapInner onPin={onPin} initialPin={initialPin} />
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink/35">
        <PinIcon width={12} height={12} strokeWidth={1.5} />
        Click the map to pin your delivery location.
      </p>
    </div>
  );
}

/** @deprecated Use MapPicker — kept as alias for older imports. */
export const MapPickerPlaceholder = MapPicker;
