"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroGallery } from "@/components/home/HeroGallery";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { useCatalog, useLandingContent } from "@/lib/hooks";
import { scatteredSample } from "@/lib/sample-images";
import { updateLandingContent } from "@/lib/site-content";
import { createClient } from "@/lib/supabase/client";
import type { LandingContent } from "@/lib/types";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const videoTypes = ["video/mp4", "video/webm"];

function managedPath(url: string) {
  const marker = "/storage/v1/object/public/landing-media/";
  const index = url.indexOf(marker);
  return index === -1
    ? null
    : decodeURIComponent(url.slice(index + marker.length));
}

function UploadControl({
  label,
  accept,
  disabled,
  onFile,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
      {disabled ? "Uploading…" : label}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

export default function AdminLandingPage() {
  const { products, brands, categories, ready: catalogReady } = useCatalog();
  const { content, ready: contentReady, setContent } = useLandingContent();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAndSave = async (
    file: File,
    key: string,
    oldUrl: string,
    patchForUrl: (url: string) => Partial<LandingContent>
  ) => {
    const isVideo = key === "hero";
    const allowed = isVideo ? videoTypes : imageTypes;
    const maxSize = isVideo ? 100 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!allowed.includes(file.type) || file.size > maxSize) {
      setError(
        isVideo
          ? "Use an MP4 or WebM video up to 100 MB."
          : "Use a JPG, PNG, WebP, or AVIF image up to 8 MB."
      );
      return;
    }

    setBusy(key);
    setError(null);
    const supabase = createClient();
    let uploadedPath: string | null = null;
    let saved = false;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Your admin session expired. Please sign in again.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      uploadedPath = `${user.id}/${key}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("landing-media")
        .upload(uploadedPath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("landing-media")
        .getPublicUrl(uploadedPath);
      const updated = await updateLandingContent(patchForUrl(data.publicUrl));
      setContent(updated);
      saved = true;

      const previousPath = managedPath(oldUrl);
      if (previousPath && previousPath !== uploadedPath) {
        const { error: removeError } = await supabase.storage
          .from("landing-media")
          .remove([previousPath]);
        if (removeError) {
          setError(
            "The new media is live, but the previous file could not be removed."
          );
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update the media."
      );
      // If saving failed, do not leave the newly uploaded file orphaned.
      if (uploadedPath && !saved) {
        await supabase.storage.from("landing-media").remove([uploadedPath]);
      }
    } finally {
      setBusy(null);
    }
  };

  if (!catalogReady || !contentReady) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  const subcategories = Array.from(
    categories
      .filter((category) => category.parentId)
      .reduce((groups, category) => {
        const key = category.name.trim().toLowerCase();
        const existing = groups.get(key);
        if (existing) {
          existing.ids.push(category.id);
        } else {
          groups.set(key, { name: category.name, ids: [category.id] });
        }
        return groups;
      }, new Map<string, { name: string; ids: string[] }>())
      .values()
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Storefront Editor</p>
          <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] text-ink sm:text-[2.6rem]">
            Landing Page
          </h1>
        </div>
        <Link href="/" target="_blank" className="btn-secondary !px-6 !py-3">
          Open Live Page
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 border border-brand/20 bg-brand-faint px-4 py-3 text-sm text-brand"
        >
          {error}
        </p>
      )}

      {/* Hero preview */}
      <section className="mt-10 overflow-hidden border border-ink/10 bg-surface">
        <div className="relative aspect-video overflow-hidden bg-ink">
          <video
            key={content.heroVideoUrl}
            src={content.heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
            <div>
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/65">
                Est. Manila · One of One
              </p>
              <p className="mt-4 font-display text-3xl font-medium sm:text-5xl">
                Rare pieces, <em className="font-normal">quietly curated.</em>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-medium text-ink">
              Hero Video
            </h2>
            <p className="mt-1 text-[12px] text-ink/45">
              Replacing an uploaded video removes the previous file from your
              landing-media bucket.
            </p>
          </div>
          <UploadControl
            label="Replace Video"
            accept="video/mp4,video/webm"
            disabled={busy !== null}
            onFile={(file) =>
              void uploadAndSave(
                file,
                "hero",
                content.heroVideoUrl,
                (url) => ({ heroVideoUrl: url })
              )
            }
          />
        </div>
      </section>

      {/* Partner brand preview and controls */}
      <section className="mt-12 border border-ink/10 bg-surface p-5 sm:p-8">
        <HeroGallery images={content.brandImages} />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {BRAND_LOGOS.map((fallback, index) => {
            const current: string | StaticImageData =
              content.brandImages[index] || fallback;
            return (
              <div key={index} className="border border-ink/10 p-3">
                <div className="relative aspect-square bg-paper">
                  <Image
                    src={current}
                    alt={`Partner brand ${index + 1}`}
                    fill
                    sizes="160px"
                    className="object-contain p-3"
                  />
                </div>
                <p className="my-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-ink/45">
                  Partner Brand {index + 1}
                </p>
                <UploadControl
                  label="Change"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy !== null}
                  onFile={(file) =>
                    void uploadAndSave(
                      file,
                      `brand-${index + 1}`,
                      content.brandImages[index] || "",
                      (url) => {
                        const next = Array.from(
                          { length: 6 },
                          (_, slot) => content.brandImages[slot] || ""
                        );
                        next[index] = url;
                        return { brandImages: next };
                      }
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Product rows appear in the same order as the live landing page. */}
      <div className="mt-12 overflow-hidden border border-ink/10 bg-paper">
        <ProductCarousel
          title="New Arrivals"
          subtitle="Fresh finds, just racked"
          href="/shop?section=new-arrivals"
          products={products.filter((product) => product.isNewArrival).slice(0, 2)}
          brands={brands}
        />
        <ProductCarousel
          title="On Sale"
          subtitle="Good catches, better prices"
          href="/shop?section=on-sale"
          products={products.filter((product) => product.onSale).slice(0, 2)}
          brands={brands}
        />
      </div>

      {/* Subcategory preview and image controls */}
      <section className="mt-12 border border-ink/10 bg-surface p-5 sm:p-8">
        <p className="eyebrow">Departments</p>
        <h2 className="mt-3 font-display text-2xl font-medium text-ink">
          Shop by Category
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {subcategories.map((category, index) => {
            const image =
              category.ids
                .map((id) => content.categoryImages[id])
                .find(Boolean) || scatteredSample(index + 3);
            return (
              <div key={category.name.toLowerCase()} className="border border-ink/10 p-3">
                <div className="relative aspect-[4/5] overflow-hidden bg-brand-soft">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white">
                    <p className="font-display text-lg font-medium">
                      {category.name}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <UploadControl
                    label="Change Image"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy !== null}
                    onFile={(file) =>
                      void uploadAndSave(
                        file,
                        `category-${index + 1}`,
                        category.ids
                          .map((id) => content.categoryImages[id])
                          .find(Boolean) || "",
                        (url) => ({
                          categoryImages: {
                            ...content.categoryImages,
                            ...Object.fromEntries(
                              category.ids.map((id) => [id, url])
                            ),
                          },
                        })
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
