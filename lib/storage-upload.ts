"use client";

/**
 * Upload to the landing-media bucket with XHR so we can report 0–100% progress.
 * (supabase-js storage.upload has no progress events.)
 */
export function uploadLandingMediaWithProgress(
  path: string,
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return Promise.reject(
      new Error("Supabase URL / anon key is missing from the environment.")
    );
  }

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `${baseUrl}/storage/v1/object/landing-media/${encodedPath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "31536000");
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        onProgress(0);
        return;
      }
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      let message = `Upload failed (${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText) as {
          message?: string;
          error?: string;
        };
        message = parsed.message || parsed.error || message;
      } catch {
        if (xhr.responseText?.trim()) message = xhr.responseText.trim();
      }
      reject(new Error(message));
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload was cancelled."));
    };

    onProgress(0);
    xhr.send(file);
  });
}
