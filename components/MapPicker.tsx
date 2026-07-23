"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LocateIcon, PinIcon } from "./icons";

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
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("Location is not supported on this device.");
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const next: [number, number] = [latitude, longitude];
        setFlyTo(next);
        onPin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setLocating(false);
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow access to pin your current spot."
            : err.code === err.TIMEOUT
              ? "Timed out getting your location. Try again."
              : "Could not get your current location.";
        setLocateError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (!ready) {
    return (
      <div className="grid h-56 w-full place-items-center border border-ink/12 bg-cream text-[11px] uppercase tracking-[0.2em] text-ink/35">
        Loading map…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 border border-ink/15 bg-cream px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <LocateIcon width={13} height={13} strokeWidth={1.5} />
          {locating ? "Locating…" : "Use current location"}
        </button>
      </div>

      <MapInner onPin={onPin} initialPin={initialPin} flyTo={flyTo} />

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink/35">
        <PinIcon width={12} height={12} strokeWidth={1.5} />
        Click the map to pin, or use your current location.
      </p>
      {locateError && (
        <p role="alert" className="mt-1.5 text-[11px] text-brand">
          {locateError}
        </p>
      )}
    </div>
  );
}

/** @deprecated Use MapPicker — kept as alias for older imports. */
export const MapPickerPlaceholder = MapPicker;
