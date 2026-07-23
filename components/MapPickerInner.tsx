"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Default view near Bicol (Legazpi) — seller origin. */
const DEFAULT_CENTER: [number, number] = [13.1391, 123.7437];

const pinIcon = L.divIcon({
  className: "gc-map-pin",
  html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#c45c26;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

function parsePin(value?: string): [number, number] | null {
  if (!value) return null;
  const parts = value.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1]];
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToPin({
  target,
}: {
  target: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo(target, 16, { duration: 1.1 });
  }, [target, map]);

  return null;
}

export default function MapPickerInner({
  onPin,
  initialPin,
  flyTo,
}: {
  onPin: (location: string) => void;
  initialPin?: string;
  /** When set (e.g. from geolocation), fly the map and drop a pin. */
  flyTo?: [number, number] | null;
}) {
  const [position, setPosition] = useState<[number, number] | null>(() =>
    parsePin(initialPin)
  );

  useEffect(() => {
    setPosition(parsePin(initialPin));
  }, [initialPin]);

  useEffect(() => {
    if (!flyTo) return;
    setPosition(flyTo);
  }, [flyTo]);

  const handlePick = (lat: number, lng: number) => {
    const next: [number, number] = [lat, lng];
    setPosition(next);
    onPin(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  return (
    <MapContainer
      center={position ?? DEFAULT_CENTER}
      zoom={13}
      scrollWheelZoom
      className="h-56 w-full border border-ink/12 z-0"
      style={{ height: 224 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={handlePick} />
      <FlyToPin target={flyTo ?? null} />
      {position && <Marker position={position} icon={pinIcon} />}
    </MapContainer>
  );
}
