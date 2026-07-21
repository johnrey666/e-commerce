import { createClient } from "./supabase/client";
import type { LandingContent, StoreInfoContent } from "./types";

export const DEFAULT_STORE_INFO: StoreInfoContent = {
  eyebrow: "Visit Us",
  title: "Store Info",
  subtitle:
    "Cool people like thrifting — step through the door and see the floor.",
  tagline: "Buy · Sell · Trade · Consign",
  exteriorUrl: "",
  interiorUrls: [],
  details: [
    {
      label: "Hours",
      value: "Mon – Sun",
      detail: "10:00 AM – 8:00 PM",
    },
    {
      label: "Location",
      value: "Legazpi City",
      detail: "Peñaranda St, Albay",
      href: "https://maps.app.goo.gl/WoB33D1QXzXSSpdH6",
    },
    {
      label: "Social",
      value: "@goodcatch",
      detail: "Instagram & Facebook",
      href: "https://www.facebook.com/goodcatch.ph",
    },
  ],
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroVideoUrl: "/sample.mp4",
  brandImages: [],
  brandsTitle: "Sourced from the world's finest brands",
  categoryImages: {},
  storeInfo: DEFAULT_STORE_INFO,
};

interface SiteContentRow {
  hero_video_url: string;
  brand_images: string[];
  brands_title?: string | null;
  category_images: Record<string, string>;
  store_info?: Partial<StoreInfoContent> | null;
}

function mergeStoreInfo(
  raw?: Partial<StoreInfoContent> | null
): StoreInfoContent {
  const base = DEFAULT_STORE_INFO;
  if (!raw || typeof raw !== "object") return { ...base, details: [...base.details] };
  return {
    eyebrow: raw.eyebrow ?? base.eyebrow,
    title: raw.title ?? base.title,
    subtitle: raw.subtitle ?? base.subtitle,
    tagline: raw.tagline ?? base.tagline,
    exteriorUrl: raw.exteriorUrl ?? base.exteriorUrl,
    interiorUrls: Array.isArray(raw.interiorUrls)
      ? raw.interiorUrls.filter(Boolean)
      : [...base.interiorUrls],
    details:
      Array.isArray(raw.details) && raw.details.length > 0
        ? raw.details.map((d) => ({
            label: d.label ?? "",
            value: d.value ?? "",
            detail: d.detail ?? "",
            href: d.href || undefined,
          }))
        : [...base.details],
  };
}

function mapLandingContent(row: SiteContentRow): LandingContent {
  return {
    heroVideoUrl: row.hero_video_url || DEFAULT_LANDING_CONTENT.heroVideoUrl,
    brandImages: (row.brand_images ?? []).filter(Boolean),
    brandsTitle:
      row.brands_title?.trim() || DEFAULT_LANDING_CONTENT.brandsTitle,
    categoryImages: row.category_images ?? {},
    storeInfo: mergeStoreInfo(row.store_info),
  };
}

const SELECT_COLS =
  "hero_video_url, brand_images, brands_title, category_images, store_info";

export async function fetchLandingContent(): Promise<LandingContent> {
  const { data, error } = await createClient()
    .from("site_content")
    .select(SELECT_COLS)
    .eq("id", "landing")
    .single();

  if (error) {
    // Older DBs without new columns — fall back to legacy select.
    const legacy = await createClient()
      .from("site_content")
      .select("hero_video_url, brand_images, category_images")
      .eq("id", "landing")
      .single();
    if (legacy.error) throw new Error(legacy.error.message);
    return mapLandingContent(legacy.data as SiteContentRow);
  }
  return mapLandingContent(data as SiteContentRow);
}

export async function updateLandingContent(
  patch: Partial<LandingContent>
): Promise<LandingContent> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.heroVideoUrl !== undefined) {
    payload.hero_video_url = patch.heroVideoUrl;
  }
  if (patch.brandImages !== undefined) {
    payload.brand_images = patch.brandImages.filter(Boolean);
  }
  if (patch.brandsTitle !== undefined) {
    payload.brands_title = patch.brandsTitle;
  }
  if (patch.categoryImages !== undefined) {
    payload.category_images = patch.categoryImages;
  }
  if (patch.storeInfo !== undefined) {
    payload.store_info = patch.storeInfo;
  }

  const { data, error } = await createClient()
    .from("site_content")
    .update(payload)
    .eq("id", "landing")
    .select(SELECT_COLS)
    .single();

  if (error) throw new Error(error.message);
  return mapLandingContent(data as SiteContentRow);
}
