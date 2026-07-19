import { createClient } from "./supabase/client";
import type { LandingContent } from "./types";

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroVideoUrl: "/sample.mp4",
  brandImages: [],
  categoryImages: {},
};

interface SiteContentRow {
  hero_video_url: string;
  brand_images: string[];
  category_images: Record<string, string>;
}

function mapLandingContent(row: SiteContentRow): LandingContent {
  return {
    heroVideoUrl: row.hero_video_url || DEFAULT_LANDING_CONTENT.heroVideoUrl,
    brandImages: row.brand_images ?? [],
    categoryImages: row.category_images ?? {},
  };
}

export async function fetchLandingContent(): Promise<LandingContent> {
  const { data, error } = await createClient()
    .from("site_content")
    .select("hero_video_url, brand_images, category_images")
    .eq("id", "landing")
    .single();

  if (error) throw new Error(error.message);
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
    payload.brand_images = patch.brandImages;
  }
  if (patch.categoryImages !== undefined) {
    payload.category_images = patch.categoryImages;
  }

  const { data, error } = await createClient()
    .from("site_content")
    .update(payload)
    .eq("id", "landing")
    .select("hero_video_url, brand_images, category_images")
    .single();

  if (error) throw new Error(error.message);
  return mapLandingContent(data as SiteContentRow);
}
