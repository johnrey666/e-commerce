"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroGallery } from "@/components/home/HeroGallery";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { useCatalog, useLandingContent } from "@/lib/hooks";
import { scatteredSample } from "@/lib/sample-images";
import {
  DEFAULT_STORE_INFO,
  updateLandingContent,
} from "@/lib/site-content";
import { createClient } from "@/lib/supabase/client";
import type { LandingContent, StoreInfoContent, StoreInfoDetail } from "@/lib/types";

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

const fieldLabel =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55";

export default function AdminLandingPage() {
  const { products, brands, categories, ready: catalogReady } = useCatalog();
  const { content, ready: contentReady, setContent } = useLandingContent();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingText, setSavingText] = useState(false);

  const storeInfo = content.storeInfo ?? DEFAULT_STORE_INFO;

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
      if (uploadedPath && !saved) {
        await supabase.storage.from("landing-media").remove([uploadedPath]);
      }
    } finally {
      setBusy(null);
    }
  };

  const saveStoreInfo = async (next: StoreInfoContent) => {
    setSavingText(true);
    setError(null);
    try {
      const updated = await updateLandingContent({ storeInfo: next });
      setContent(updated);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save store info."
      );
    } finally {
      setSavingText(false);
    }
  };

  const patchStoreInfo = (partial: Partial<StoreInfoContent>) => {
    void saveStoreInfo({ ...storeInfo, ...partial });
  };

  const removeStorageUrl = async (url: string) => {
    const path = managedPath(url);
    if (!path) return;
    const supabase = createClient();
    await supabase.storage.from("landing-media").remove([path]);
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

      {/* Hero */}
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
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-medium text-ink">
              Hero Video
            </h2>
            <p className="mt-1 text-[12px] text-ink/45">
              Replacing an uploaded video removes the previous file.
            </p>
          </div>
          <UploadControl
            label="Replace Video"
            accept="video/mp4,video/webm"
            disabled={busy !== null}
            onFile={(file) =>
              void uploadAndSave(file, "hero", content.heroVideoUrl, (url) => ({
                heroVideoUrl: url,
              }))
            }
          />
        </div>
      </section>

      {/* Partner brands — add / remove freely */}
      <section className="mt-12 border border-ink/10 bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Partner Brands</p>
            <h2 className="mt-2 font-display text-2xl font-medium text-ink">
              Brand logos
            </h2>
            <p className="mt-1 text-[12px] text-ink/45">
              Upload any number of partner logos — or none. Each can be replaced
              or removed. The strip on the storefront only shows what you add
              here.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className={fieldLabel}>Section title</label>
          <div className="flex flex-wrap gap-3">
            <input
              className="input-field max-w-xl flex-1"
              defaultValue={content.brandsTitle}
              key={content.brandsTitle}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value === content.brandsTitle) return;
                void updateLandingContent({ brandsTitle: value || content.brandsTitle })
                  .then(setContent)
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Could not save title."
                    )
                  );
              }}
            />
          </div>
        </div>

        <div className="mt-8">
          <HeroGallery
            images={content.brandImages}
            title={content.brandsTitle}
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {content.brandImages.map((url, index) => (
            <div key={`${url}-${index}`} className="border border-ink/10 p-3">
              <div className="relative aspect-square bg-paper">
                <Image
                  src={url}
                  alt={`Partner brand ${index + 1}`}
                  fill
                  sizes="160px"
                  className="object-contain p-3"
                />
              </div>
              <p className="my-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-ink/45">
                Logo {index + 1}
              </p>
              <div className="flex flex-col gap-2">
                <UploadControl
                  label="Replace"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy !== null}
                  onFile={(file) =>
                    void uploadAndSave(
                      file,
                      `brand-${index + 1}`,
                      url,
                      (nextUrl) => {
                        const next = [...content.brandImages];
                        next[index] = nextUrl;
                        return { brandImages: next };
                      }
                    )
                  }
                />
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    void (async () => {
                      setBusy(`brand-del-${index}`);
                      setError(null);
                      try {
                        const next = content.brandImages.filter(
                          (_, i) => i !== index
                        );
                        const updated = await updateLandingContent({
                          brandImages: next,
                        });
                        setContent(updated);
                        await removeStorageUrl(url);
                      } catch (caught) {
                        setError(
                          caught instanceof Error
                            ? caught.message
                            : "Could not remove logo."
                        );
                      } finally {
                        setBusy(null);
                      }
                    })();
                  }}
                  className="border border-brand/25 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-brand hover:bg-brand hover:text-white disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <UploadControl
            label="Add Brand Logo"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy !== null}
            onFile={(file) =>
              void uploadAndSave(file, `brand-new`, "", (url) => ({
                brandImages: [...content.brandImages, url],
              }))
            }
          />
          {content.brandImages.length > 0 && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                void (async () => {
                  setBusy("brand-clear");
                  setError(null);
                  try {
                    const previous = [...content.brandImages];
                    const updated = await updateLandingContent({
                      brandImages: [],
                    });
                    setContent(updated);
                    await Promise.all(previous.map(removeStorageUrl));
                  } catch (caught) {
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not clear logos."
                    );
                  } finally {
                    setBusy(null);
                  }
                })();
              }}
              className="border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Remove All Logos
            </button>
          )}
        </div>
      </section>

      {/* Store Info */}
      <section className="mt-12 border border-ink/10 bg-surface p-5 sm:p-8">
        <p className="eyebrow">Visit Us</p>
        <h2 className="mt-2 font-display text-2xl font-medium text-ink">
          Store Info
        </h2>
        <p className="mt-1 text-[12px] text-ink/45">
          Edit copy, hours/location/social, exterior photo, and interior
          gallery images.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["eyebrow", "Eyebrow"],
              ["title", "Title"],
              ["tagline", "Overlay tagline"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={fieldLabel}>{label}</label>
              <input
                className="input-field"
                defaultValue={storeInfo[key]}
                key={`${key}-${storeInfo[key]}`}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value === storeInfo[key]) return;
                  patchStoreInfo({ [key]: value });
                }}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Subtitle</label>
            <textarea
              className="input-field"
              rows={2}
              defaultValue={storeInfo.subtitle}
              key={`subtitle-${storeInfo.subtitle}`}
              onBlur={(e) => {
                if (e.target.value === storeInfo.subtitle) return;
                patchStoreInfo({ subtitle: e.target.value });
              }}
            />
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink">
            Details
          </h3>
          <div className="mt-4 space-y-4">
            {storeInfo.details.map((detail, index) => (
              <div
                key={index}
                className="grid gap-3 border border-ink/10 p-4 sm:grid-cols-2"
              >
                {(
                  [
                    ["label", "Label"],
                    ["value", "Value"],
                    ["detail", "Detail"],
                    ["href", "Link (optional)"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className={fieldLabel}>{label}</label>
                    <input
                      className="input-field"
                      defaultValue={detail[field] ?? ""}
                      key={`${index}-${field}-${detail[field] ?? ""}`}
                      onBlur={(e) => {
                        const value = e.target.value;
                        const current = detail[field] ?? "";
                        if (value === current) return;
                        const nextDetails: StoreInfoDetail[] =
                          storeInfo.details.map((d, i) =>
                            i === index
                              ? {
                                  ...d,
                                  [field]:
                                    field === "href"
                                      ? value || undefined
                                      : value,
                                }
                              : d
                          );
                        patchStoreInfo({ details: nextDetails });
                      }}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled={savingText || storeInfo.details.length <= 1}
                    onClick={() => {
                      const nextDetails = storeInfo.details.filter(
                        (_, i) => i !== index
                      );
                      patchStoreInfo({ details: nextDetails });
                    }}
                    className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand disabled:opacity-40"
                  >
                    Remove detail
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={savingText}
            onClick={() =>
              patchStoreInfo({
                details: [
                  ...storeInfo.details,
                  { label: "New", value: "", detail: "" },
                ],
              })
            }
            className="mt-4 border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/65 hover:border-ink hover:text-ink"
          >
            Add Detail
          </button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink">
              Exterior image
            </h3>
            <div className="relative mt-4 aspect-[16/10] overflow-hidden bg-brand-soft">
              {storeInfo.exteriorUrl ? (
                <Image
                  src={storeInfo.exteriorUrl}
                  alt="Exterior"
                  fill
                  className="object-cover"
                  sizes="480px"
                />
              ) : (
                <div className="grid size-full place-items-center text-[11px] uppercase tracking-[0.2em] text-ink/35">
                  Using default storefront photo
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <UploadControl
                label="Change Exterior"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy !== null}
                onFile={(file) =>
                  void uploadAndSave(
                    file,
                    "store-exterior",
                    storeInfo.exteriorUrl,
                    (url) => ({
                      storeInfo: { ...storeInfo, exteriorUrl: url },
                    })
                  )
                }
              />
              {storeInfo.exteriorUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const old = storeInfo.exteriorUrl;
                    void saveStoreInfo({ ...storeInfo, exteriorUrl: "" }).then(
                      () => removeStorageUrl(old)
                    );
                  }}
                  className="border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60"
                >
                  Use Default
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink">
              Interior gallery
            </h3>
            <p className="mt-1 text-[12px] text-ink/45">
              Add multiple photos for the “Step Inside” carousel. Empty uses
              the bundled defaults.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {storeInfo.interiorUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="relative aspect-[3/4]">
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = storeInfo.interiorUrls.filter(
                        (_, i) => i !== index
                      );
                      void saveStoreInfo({
                        ...storeInfo,
                        interiorUrls: next,
                      }).then(() => removeStorageUrl(url));
                    }}
                    className="absolute inset-x-1 bottom-1 bg-ink/70 py-1 text-[8px] uppercase tracking-[0.15em] text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <UploadControl
                label="Add Interior Photo"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy !== null}
                onFile={(file) =>
                  void uploadAndSave(file, "store-interior", "", (url) => ({
                    storeInfo: {
                      ...storeInfo,
                      interiorUrls: [...storeInfo.interiorUrls, url],
                    },
                  }))
                }
              />
              {storeInfo.interiorUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const previous = [...storeInfo.interiorUrls];
                    void saveStoreInfo({
                      ...storeInfo,
                      interiorUrls: [],
                    }).then(() =>
                      Promise.all(previous.map(removeStorageUrl))
                    );
                  }}
                  className="border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60"
                >
                  Clear Interior
                </button>
              )}
            </div>
          </div>
        </div>

        {savingText && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink/40">
            Saving…
          </p>
        )}
      </section>

      {/* Product rows preview */}
      <div className="mt-12 overflow-hidden border border-ink/10 bg-paper">
        <ProductCarousel
          title="New Arrivals"
          subtitle="Fresh finds, just racked"
          href="/shop?section=new-arrivals"
          products={products
            .filter((product) => product.isNewArrival)
            .slice(0, 2)}
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

      {/* Categories */}
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
              <div
                key={category.name.toLowerCase()}
                className="border border-ink/10 p-3"
              >
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
