/** Soft target under Supabase Free global limit (50 MB). */
export const HERO_UPLOAD_TARGET_BYTES = 48 * 1024 * 1024;
/** Max source size accepted for server-side compression. */
export const HERO_SOURCE_MAX_BYTES = 250 * 1024 * 1024;

export function mbLabel(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadError(caught: unknown): string {
  const raw =
    caught instanceof Error
      ? caught.message
      : typeof caught === "string"
        ? caught
        : caught &&
            typeof caught === "object" &&
            "message" in caught &&
            typeof (caught as { message: unknown }).message === "string"
          ? (caught as { message: string }).message
          : "";

  const msg = raw.trim();
  if (!msg) {
    return "Could not update the media. Open the browser console (F12) for details.";
  }

  if (/exceeded the maximum allowed size|maximum allowed size|entity too large|413/i.test(msg)) {
    return (
      "Supabase blocked the upload (file still too large for your plan’s global limit). " +
      "Try again — hero videos over ~48 MB are compressed on the server first."
    );
  }

  return msg;
}

/** Compress a hero video on the Next.js server (ffmpeg) down toward &lt;48 MB. */
export async function compressHeroOnServer(
  file: File,
  onStatus?: (message: string) => void
): Promise<File> {
  if (file.size <= HERO_UPLOAD_TARGET_BYTES) {
    return file;
  }

  onStatus?.("Compressing on server…");
  const body = new FormData();
  body.append("file", file, file.name || "hero.mp4");

  const response = await fetch("/api/admin/compress-hero", {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = `Compression failed (${response.status}).`;
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      if (/Failed to parse body as FormData/i.test(text)) {
        message =
          "Server rejected the upload body (size limit). Restart npm run dev after the latest config change, then try again.";
      } else if (text.trim()) {
        message = text.trim().slice(0, 300);
      }
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  onStatus?.(
    `Compressed to ${mbLabel(blob.size)} — uploading…`
  );
  return new File([blob], "hero.mp4", { type: "video/mp4" });
}
