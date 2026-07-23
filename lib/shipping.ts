import type { ShippingCarrier } from "@/lib/types";

/**
 * Seller / warehouse origin: Bicol Region (Region V) — South Luzon.
 * Rates are flat PHP fees for a light apparel parcel.
 * J&T bases are seller-set; LBC / DHL use modest premiums over those.
 */

export const SELLER_ORIGIN_REGION = "Bicol Region (Region V)";

export type ShippingZone =
  | "bicol"
  | "ncr"
  | "luzon"
  | "visayas"
  | "mindanao"
  | "island"
  | "international";

/** Destination zone from checkout country + region. */
export function resolveShippingZone(
  country: string,
  region: string
): ShippingZone {
  if (country.trim().toLowerCase() !== "philippines") {
    return "international";
  }

  const r = region.trim();

  if (r.includes("Bicol") || r.includes("Region V")) return "bicol";
  if (r.includes("National Capital") || r.includes("NCR")) return "ncr";

  if (
    r.includes("Mimaropa") ||
    r.includes("IV-B") ||
    r.includes("Bangsamoro") ||
    r.includes("BARMM")
  ) {
    return "island";
  }

  if (
    r.includes("Western Visayas") ||
    r.includes("Central Visayas") ||
    r.includes("Eastern Visayas") ||
    r.includes("Region VI") ||
    r.includes("Region VII") ||
    r.includes("Region VIII")
  ) {
    return "visayas";
  }

  if (
    r.includes("Zamboanga") ||
    r.includes("Northern Mindanao") ||
    r.includes("Davao") ||
    r.includes("Soccsksargen") ||
    r.includes("Caraga") ||
    r.includes("Region IX") ||
    r.includes("Region X") ||
    r.includes("Region XI") ||
    r.includes("Region XII") ||
    r.includes("Region XIII")
  ) {
    return "mindanao";
  }

  // Remaining PH regions (CAR, Ilocos, Cagayan, Central Luzon, Calabarzon, etc.)
  return "luzon";
}

/**
 * Flat PHP fees by carrier × zone (Bicol origin).
 * J&T: seller-set base rates for a light apparel parcel.
 * LBC / DHL: modest premiums over J&T (not full retail quotes).
 */
const RATES: Record<ShippingCarrier, Record<ShippingZone, number>> = {
  JNT: {
    bicol: 75,
    ncr: 95,
    luzon: 95,
    visayas: 100,
    mindanao: 105,
    island: 115,
    international: 450,
  },
  LBC: {
    bicol: 95,
    ncr: 115,
    luzon: 115,
    visayas: 120,
    mindanao: 125,
    island: 135,
    international: 520,
  },
  DHL: {
    bicol: 130,
    ncr: 150,
    luzon: 150,
    visayas: 160,
    mindanao: 170,
    island: 180,
    international: 650,
  },
};

const ZONE_LABELS: Record<ShippingZone, string> = {
  bicol: "Bicol (local)",
  ncr: "Metro Manila",
  luzon: "Luzon",
  visayas: "Visayas",
  mindanao: "Mindanao",
  island: "Island / remote",
  international: "International",
};

const ETA_DAYS: Record<ShippingCarrier, Record<ShippingZone, string>> = {
  JNT: {
    bicol: "3–5 days",
    ncr: "3–5 days",
    luzon: "3–5 days",
    visayas: "5–7 days",
    mindanao: "5–7 days",
    island: "5–7 days",
    international: "5–7 days",
  },
  LBC: {
    bicol: "3–5 days",
    ncr: "3–5 days",
    luzon: "3–5 days",
    visayas: "5–7 days",
    mindanao: "5–7 days",
    island: "5–7 days",
    international: "5–7 days",
  },
  DHL: {
    bicol: "3–5 days",
    ncr: "3–5 days",
    luzon: "3–5 days",
    visayas: "5–7 days",
    mindanao: "5–7 days",
    island: "5–7 days",
    international: "5–7 days",
  },
};

export function calculateShippingFee(input: {
  country: string;
  region: string;
  carrier: ShippingCarrier;
}): {
  fee: number;
  zone: ShippingZone;
  zoneLabel: string;
  eta: string;
} {
  const zone = resolveShippingZone(input.country, input.region);
  const fee = RATES[input.carrier][zone];
  return {
    fee,
    zone,
    zoneLabel: ZONE_LABELS[zone],
    eta: ETA_DAYS[input.carrier][zone],
  };
}

export function shippingFeesForAllCarriers(
  country: string,
  region: string
): Record<ShippingCarrier, ReturnType<typeof calculateShippingFee>> {
  return {
    JNT: calculateShippingFee({ country, region, carrier: "JNT" }),
    DHL: calculateShippingFee({ country, region, carrier: "DHL" }),
    LBC: calculateShippingFee({ country, region, carrier: "LBC" }),
  };
}
