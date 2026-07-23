"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroGallery } from "@/components/home/HeroGallery";
import { Lookbook } from "@/components/home/Lookbook";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { useCatalog, useLandingContent } from "@/lib/hooks";
import { isOthersCategory } from "@/lib/categories";
import { scatteredSample } from "@/lib/sample-images";
import {
  DEFAULT_STORE_INFO,
  updateLandingContent,
} from "@/lib/site-content";
import {
  compressHeroOnServer,
  formatUploadError,
  HERO_SOURCE_MAX_BYTES,
  HERO_UPLOAD_TARGET_BYTES,
  mbLabel,
} from "@/lib/compress-hero-video";
import { deleteLandingMedia } from "@/lib/landing-media";
import { createClient } from "@/lib/supabase/client";
import { uploadLandingMediaWithProgress } from "@/lib/storage-upload";
import type { LandingContent, StoreInfoContent, StoreInfoDetail } from "@/lib/types";

const LOOKBOOK_MAX = 5;

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];

function isAllowedVideo(file: File) {
  if (videoTypes.includes(file.type)) return true;
  return /\.(mp4|webm|mov)$/i.test(file.name);
}

function isAllowedImage(file: File) {
  if (imageTypes.includes(file.type)) return true;
  return /\.(jpe?g|png|webp|avif)$/i.test(file.name);
}

function UploadControl({
  label,
  accept,
  disabled,
  busyLabel = "Uploading…",
  onFile,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  busyLabel?: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/65 transition-colors hover:border-ink hover:text-ink">
      {disabled ? busyLabel : label}
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
  const [busyLabel, setBusyLabel] = useState("Uploading…");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingText, setSavingText] = useState(false);

  const storeInfo = content.storeInfo ?? DEFAULT_STORE_INFO;

  const purgeUrls = async (
    urls: Array<string | null | undefined>,
    options?: { prefix?: string; keepPath?: string }
  ) => {
    const result = await deleteLandingMedia({
      urls,
      prefix: options?.prefix,
      keepPath: options?.keepPath,
    });
    if (!result.ok) {
      setError(
        result.error ||
          "The new media is live, but an old file could not be removed from storage. Check SUPABASE_SERVICE_ROLE_KEY in .env.local."
      );
      return;
    }
    if ((options?.prefix || urls.some(Boolean)) && result.removed === 0) {
      console.warn("[landing purge] nothing removed", { urls, options, result });
    }
  };

  const uploadAndSave = async (
    file: File,
    key: string,
    oldUrls: string | string[],
    patchForUrl: (url: string) => Partial<LandingContent>
  ) => {
    const isVideo = key === "hero";
    const isLookbook = key.startsWith("lookbook");
    const typeOk = isVideo ? isAllowedVideo(file) : isAllowedImage(file);
    const maxSize = isVideo
      ? HERO_SOURCE_MAX_BYTES
      : isLookbook
        ? 20 * 1024 * 1024
        : 8 * 1024 * 1024;
    if (!typeOk) {
      setError(
        isVideo
          ? "Use an MP4 or WebM video file."
          : isLookbook
            ? "Use a JPG, PNG, WebP, or AVIF lookbook photo."
            : "Use a JPG, PNG, WebP, or AVIF image."
      );
      return;
    }
    if (file.size > maxSize) {
      setError(
        isVideo
          ? `This video is ${mbLabel(file.size)} (limit ${mbLabel(maxSize)}). Compress it under ${mbLabel(maxSize)} and try again.`
          : isLookbook
            ? `This photo is ${mbLabel(file.size)} (limit 20.0 MB).`
            : `This image is ${mbLabel(file.size)} (limit 8.0 MB).`
      );
      return;
    }

    setBusy(key);
    setBusyLabel("Preparing…");
    setUploadProgress(0);
    setError(null);
    const supabase = createClient();
    let uploadedPath: string | null = null;
    let saved = false;
    const previousUrls = Array.isArray(oldUrls) ? oldUrls : [oldUrls];

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user || !session.access_token) {
        throw new Error("Your admin session expired. Please sign in again.");
      }

      let uploadFile = file;

      if (isVideo && file.size > HERO_UPLOAD_TARGET_BYTES) {
        setBusyLabel("Compressing… (can take a few minutes)");
        setUploadProgress(0);
        uploadFile = await compressHeroOnServer(file, (msg) => {
          setBusyLabel(msg);
        });
        if (uploadFile.size > HERO_UPLOAD_TARGET_BYTES) {
          throw new Error(
            `Compressed file is still ${mbLabel(uploadFile.size)} (need under ${mbLabel(HERO_UPLOAD_TARGET_BYTES)} for Free Supabase).`
          );
        }
      }

      setBusyLabel("Uploading 0%");
      setUploadProgress(0);

      const extension = isVideo
        ? "mp4"
        : uploadFile.type === "image/png"
          ? "png"
          : uploadFile.type === "image/webp"
            ? "webp"
            : uploadFile.type === "image/avif"
              ? "avif"
              : uploadFile.name.split(".").pop()?.toLowerCase() || "bin";
      uploadedPath = `${session.user.id}/${key}/${crypto.randomUUID()}.${extension}`;

      await uploadLandingMediaWithProgress(
        uploadedPath,
        uploadFile,
        session.access_token,
        (percent) => {
          setUploadProgress(percent);
          setBusyLabel(`Uploading ${percent}%`);
        }
      );

      setBusyLabel("Saving…");
      const { data } = supabase.storage
        .from("landing-media")
        .getPublicUrl(uploadedPath);
      const newUrl = data.publicUrl;
      const updated = await updateLandingContent(patchForUrl(newUrl));
      setContent(updated);
      saved = true;
      setUploadProgress(100);

      // Delete previous objects only after the new URL is saved.
      // For hero: wipe the whole hero folder except the file we just uploaded
      // (cleans orphans from earlier failed deletes).
      if (isVideo) {
        setBusyLabel("Cleaning old videos…");
        await purgeUrls(
          previousUrls.filter((url) => url && url !== newUrl),
          {
            prefix: `${session.user.id}/hero`,
            keepPath: uploadedPath,
          }
        );
      } else {
        await purgeUrls(previousUrls.filter((url) => url && url !== newUrl));
      }
    } catch (caught) {
      console.error("[landing upload]", caught);
      setError(formatUploadError(caught));
      if (uploadedPath && !saved) {
        await fetch("/api/admin/delete-landing-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: [uploadedPath] }),
        }).catch(() => undefined);
      }
    } finally {
      setBusy(null);
      setBusyLabel("Uploading…");
      setUploadProgress(null);
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

  if (!catalogReady || !contentReady) {
    return (
      <p className="py-12 text-center text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Loading
      </p>
    );
  }

  const subcategories = Array.from(
    categories
      .filter((category) => category.parentId && !isOthersCategory(category))
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
              MP4 / WebM up to 250 MB. Files over ~48 MB are compressed on the
              server (lower quality, muted) so they fit Supabase Free’s 50 MB
              global limit, then uploaded with a 0–100% progress bar.
            </p>
            {busy === "hero" && uploadProgress !== null && (
              <div className="mt-3 max-w-sm">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-ink/55">
                  <span>{busyLabel}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden bg-ink/10">
                  <div
                    className="h-full bg-brand transition-[width] duration-150 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <UploadControl
            label="Replace Video"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={busy !== null}
            busyLabel={
              busy === "hero" && uploadProgress !== null
                ? `${uploadProgress}%`
                : busy === "hero"
                  ? busyLabel
                  : "Uploading…"
            }
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
              Preview logos with × to remove, + to add more. Hover a logo to
              replace it. The strip on the storefront only shows what you add
              here (can be empty).
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
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45">
            Preview · {content.brandImages.length} logo
            {content.brandImages.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {content.brandImages.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative size-20 border border-ink/10 bg-paper sm:size-24"
              >
                <Image
                  src={url}
                  alt={`Partner brand ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-contain p-2"
                />
                <button
                  type="button"
                  disabled={busy !== null}
                  aria-label={`Remove logo ${index + 1}`}
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
                        await purgeUrls([url]);
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
                  className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center bg-ink text-[11px] text-white shadow-sm transition-opacity hover:bg-brand disabled:opacity-50"
                >
                  ×
                </button>
                <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-ink/70 py-1 text-center text-[7px] font-medium uppercase tracking-[0.16em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy !== null}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadAndSave(
                          file,
                          `brand-${index + 1}`,
                          url,
                          (nextUrl) => {
                            const next = [...content.brandImages];
                            next[index] = nextUrl;
                            return { brandImages: next };
                          }
                        );
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            ))}
            <label
              className={`flex size-20 cursor-pointer flex-col items-center justify-center border border-dashed border-ink/25 text-ink/40 transition-colors hover:border-ink hover:text-ink sm:size-24 ${
                busy !== null ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <span className="text-2xl leading-none">+</span>
              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.18em]">
                Add
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={busy !== null}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadAndSave(file, `brand-new`, "", (url) => ({
                      brandImages: [...content.brandImages, url],
                    }));
                  }
                  event.target.value = "";
                }}
              />
            </label>
          </div>
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
                    await purgeUrls(previous);
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
              className="mt-5 border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Remove All Logos
            </button>
          )}
        </div>

        <div className="mt-10 border-t border-ink/8 pt-8">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45">
            Live strip preview
          </p>
          <HeroGallery
            images={content.brandImages}
            title={content.brandsTitle}
          />
          {content.brandImages.length === 0 && (
            <p className="mt-4 text-[12px] text-ink/40">
              No logos yet — the storefront strip stays hidden until you add
              one.
            </p>
          )}
        </div>
      </section>

      {/* Campaign lookbook */}
      <section className="mt-12 border border-ink/10 bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Campaign</p>
            <h2 className="mt-2 font-display text-2xl font-medium text-ink">
              Lookbook
            </h2>
            <p className="mt-1 text-[12px] text-ink/45">
              Model photos for the homepage editorial mosaic (up to{" "}
              {LOOKBOOK_MAX}). JPG/PNG/WebP/AVIF, max 20 MB each. Not linked to
              products — brand vibe only. Empty hides the section on the
              storefront.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className={fieldLabel}>Section title</label>
          <div className="flex flex-wrap gap-3">
            <input
              className="input-field max-w-xl flex-1"
              defaultValue={content.lookbookTitle}
              key={content.lookbookTitle}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value === content.lookbookTitle) return;
                void updateLandingContent({
                  lookbookTitle: value || content.lookbookTitle,
                })
                  .then(setContent)
                  .catch((err) =>
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Could not save lookbook title."
                    )
                  );
              }}
            />
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45">
            Photos · {content.lookbookImages.length}/{LOOKBOOK_MAX}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            {content.lookbookImages.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-[3/4] w-28 border border-ink/10 bg-paper sm:w-36"
              >
                <Image
                  src={url}
                  alt={`Lookbook ${index + 1}`}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
                <button
                  type="button"
                  disabled={busy !== null}
                  aria-label={`Remove lookbook photo ${index + 1}`}
                  onClick={() => {
                    void (async () => {
                      setBusy(`lookbook-del-${index}`);
                      setError(null);
                      try {
                        const next = content.lookbookImages.filter(
                          (_, i) => i !== index
                        );
                        const updated = await updateLandingContent({
                          lookbookImages: next,
                        });
                        setContent(updated);
                        await purgeUrls([url]);
                      } catch (caught) {
                        setError(
                          caught instanceof Error
                            ? caught.message
                            : "Could not remove photo."
                        );
                      } finally {
                        setBusy(null);
                      }
                    })();
                  }}
                  className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center bg-ink text-[11px] text-white shadow-sm transition-opacity hover:bg-brand disabled:opacity-50"
                >
                  ×
                </button>
                <div className="absolute inset-x-0 bottom-0 flex opacity-0 transition-opacity group-hover:opacity-100">
                  <label className="flex-1 cursor-pointer bg-ink/70 py-1 text-center text-[7px] font-medium uppercase tracking-[0.16em] text-white">
                    Replace
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={busy !== null}
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadAndSave(
                            file,
                            `lookbook-${index + 1}`,
                            url,
                            (nextUrl) => {
                              const next = [...content.lookbookImages];
                              next[index] = nextUrl;
                              return { lookbookImages: next };
                            }
                          );
                        }
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {index > 0 && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      aria-label={`Move photo ${index + 1} earlier`}
                      onClick={() => {
                        void (async () => {
                          setBusy(`lookbook-up-${index}`);
                          setError(null);
                          try {
                            const next = [...content.lookbookImages];
                            [next[index - 1], next[index]] = [
                              next[index],
                              next[index - 1],
                            ];
                            const updated = await updateLandingContent({
                              lookbookImages: next,
                            });
                            setContent(updated);
                          } catch (caught) {
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : "Could not reorder."
                            );
                          } finally {
                            setBusy(null);
                          }
                        })();
                      }}
                      className="bg-ink/85 px-2 py-1 text-[7px] font-medium uppercase tracking-[0.16em] text-white hover:bg-ink disabled:opacity-50"
                    >
                      ←
                    </button>
                  )}
                </div>
              </div>
            ))}
            {content.lookbookImages.length < LOOKBOOK_MAX && (
              <label
                className={`flex aspect-[3/4] w-28 cursor-pointer flex-col items-center justify-center border border-dashed border-ink/25 text-ink/40 transition-colors hover:border-ink hover:text-ink sm:w-36 ${
                  busy !== null ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <span className="text-2xl leading-none">+</span>
                <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.18em]">
                  Add
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy !== null}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadAndSave(file, "lookbook-new", "", (url) => ({
                        lookbookImages: [
                          ...content.lookbookImages,
                          url,
                        ].slice(0, LOOKBOOK_MAX),
                      }));
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {content.lookbookImages.length > 0 && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                void (async () => {
                  setBusy("lookbook-clear");
                  setError(null);
                  try {
                    const previous = [...content.lookbookImages];
                    const updated = await updateLandingContent({
                      lookbookImages: [],
                    });
                    setContent(updated);
                    await purgeUrls(previous);
                  } catch (caught) {
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Could not clear lookbook."
                    );
                  } finally {
                    setBusy(null);
                  }
                })();
              }}
              className="mt-5 border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60 hover:border-ink hover:text-ink disabled:opacity-50"
            >
              Remove All Photos
            </button>
          )}
        </div>

        <div className="mt-10 border-t border-ink/8 pt-8">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45">
            Live lookbook preview
          </p>
          <Lookbook
            images={content.lookbookImages}
            title={content.lookbookTitle}
            embedded
          />
          {content.lookbookImages.length === 0 && (
            <p className="mt-4 text-[12px] text-ink/40">
              No photos yet — the storefront lookbook stays hidden until you
              add one.
            </p>
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
                      () => purgeUrls([old])
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
                      }).then(() => purgeUrls([url]));
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
                    }).then(() => purgeUrls(previous));
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
                <div className="mt-3 flex flex-col gap-2">
                  <UploadControl
                    label="Change Image"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy !== null}
                    onFile={(file) => {
                      const oldUrls = category.ids
                        .map((id) => content.categoryImages[id])
                        .filter(Boolean);
                      void uploadAndSave(
                        file,
                        `category-${index + 1}`,
                        oldUrls,
                        (url) => ({
                          categoryImages: {
                            ...content.categoryImages,
                            ...Object.fromEntries(
                              category.ids.map((id) => [id, url])
                            ),
                          },
                        })
                      );
                    }}
                  />
                  {category.ids.some((id) => content.categoryImages[id]) && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        void (async () => {
                          setBusy(`category-del-${index}`);
                          setError(null);
                          try {
                            const oldUrls = category.ids
                              .map((id) => content.categoryImages[id])
                              .filter(Boolean);
                            const nextImages = { ...content.categoryImages };
                            for (const id of category.ids) {
                              delete nextImages[id];
                            }
                            const updated = await updateLandingContent({
                              categoryImages: nextImages,
                            });
                            setContent(updated);
                            await purgeUrls(oldUrls);
                          } catch (caught) {
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : "Could not remove category image."
                            );
                          } finally {
                            setBusy(null);
                          }
                        })();
                      }}
                      className="border border-ink/20 px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.24em] text-ink/60 hover:border-ink hover:text-ink disabled:opacity-50"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
