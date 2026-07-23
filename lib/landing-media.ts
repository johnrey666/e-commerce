/** Extract the storage object path from a public landing-media URL. */
export function landingMediaPathFromUrl(url: string): string | null {
  if (!url) return null;
  const cleaned = url.split("?")[0].split("#")[0];

  const markers = [
    "/storage/v1/object/public/landing-media/",
    "/storage/v1/render/image/public/landing-media/",
  ];

  for (const marker of markers) {
    const index = cleaned.indexOf(marker);
    if (index === -1) continue;
    const raw = cleaned.slice(index + marker.length);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function uniqueLandingMediaPaths(
  urls: Array<string | null | undefined>
): string[] {
  const paths = setFromPaths(
    urls
      .map((url) => (url ? landingMediaPathFromUrl(url) : null))
      .filter((p): p is string => Boolean(p))
  );
  return paths;
}

function setFromPaths(paths: string[]): string[] {
  return [...new Set(paths.map((p) => p.replace(/^\/+/, "").trim()).filter(Boolean))];
}

export type DeleteLandingMediaResult = {
  ok: boolean;
  error?: string;
  removed: number;
};

/**
 * Delete landing-media objects via an admin API (service role).
 * Optionally wipe a folder prefix while keeping one path (e.g. hero replace).
 */
export async function deleteLandingMedia(options: {
  urls?: Array<string | null | undefined>;
  paths?: string[];
  /** Folder prefix like `{userId}/hero` — deletes every object in it except keepPath. */
  prefix?: string;
  keepPath?: string;
}): Promise<DeleteLandingMediaResult> {
  const paths = setFromPaths([
    ...(options.paths ?? []),
    ...uniqueLandingMediaPaths(options.urls ?? []),
  ]);

  if (paths.length === 0 && !options.prefix) {
    return { ok: true, removed: 0 };
  }

  const response = await fetch("/api/admin/delete-landing-media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paths,
      prefix: options.prefix || undefined,
      keepPath: options.keepPath || undefined,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    removed?: number;
  };

  if (!response.ok) {
    return {
      ok: false,
      error: data.error || `Could not delete media (${response.status}).`,
      removed: 0,
    };
  }

  return { ok: true, removed: data.removed ?? 0 };
}

/** @deprecated Prefer deleteLandingMedia */
export async function deleteLandingMediaUrls(
  urls: Array<string | null | undefined>
): Promise<DeleteLandingMediaResult> {
  return deleteLandingMedia({ urls });
}
