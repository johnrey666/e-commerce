import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import ffmpegPath from "ffmpeg-static";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

/** Stay under Supabase Free global limit (50 MB). */
const TARGET_BYTES = 48 * 1024 * 1024;
const SOURCE_MAX_BYTES = 250 * 1024 * 1024;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  }
  return { user };
}

function parseDurationSeconds(stderr: string): number | null {
  const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = Number(match[3]);
  return h * 3600 + m * 60 + s;
}

async function probeDuration(inputPath: string): Promise<number | null> {
  if (!ffmpegPath) return null;
  try {
    await execFileAsync(ffmpegPath, ["-i", inputPath], {
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    });
    return null;
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: unknown }).stderr)
        : "";
    return parseDurationSeconds(stderr);
  }
}

async function runFfmpeg(args: string[]) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary is not available on the server.");
  }
  await execFileAsync(ffmpegPath, args, {
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  if (!ffmpegPath) {
    return NextResponse.json(
      { error: "ffmpeg is not installed in this environment." },
      { status: 500 }
    );
  }

  let tmpDir: string | null = null;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing video file." }, { status: 400 });
    }
    if (file.size > SOURCE_MAX_BYTES) {
      return NextResponse.json(
        { error: "Source video must be under 250 MB." },
        { status: 400 }
      );
    }

    // Already small enough — return as-is (may re-wrap to mp4 later on client).
    if (file.size <= TARGET_BYTES) {
      const bytes = Buffer.from(await file.arrayBuffer());
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": file.type || "video/mp4",
          "Content-Length": String(bytes.length),
          "X-Hero-Compressed": "0",
          "X-Hero-Bytes": String(bytes.length),
        },
      });
    }

    tmpDir = await mkdtemp(path.join(tmpdir(), "hero-compress-"));
    const ext = path.extname(file.name || "").toLowerCase() || ".mp4";
    const safeExt = [".mp4", ".webm", ".mov"].includes(ext) ? ext : ".mp4";
    const inputPath = path.join(tmpDir, `input${safeExt}`);
    const outputPath = path.join(tmpDir, "output.mp4");

    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    const duration = await probeDuration(inputPath);
    const attempts: string[][] = [];

    if (duration && duration > 0.5) {
      // ~90% of target budget for video stream (no audio).
      const bitsPerSec = Math.floor(((TARGET_BYTES * 8) / duration) * 0.9);
      const bitrate = Math.max(200_000, Math.min(bitsPerSec, 2_500_000));
      attempts.push([
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=1280:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-b:v",
        String(bitrate),
        "-maxrate",
        String(Math.floor(bitrate * 1.15)),
        "-bufsize",
        String(bitrate * 2),
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outputPath,
      ]);
    }

    attempts.push(
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=1280:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outputPath,
      ],
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=960:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "32",
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outputPath,
      ],
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=854:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "34",
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outputPath,
      ],
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=640:-2",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "36",
        "-an",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        outputPath,
      ]
    );

    let outSize = Number.POSITIVE_INFINITY;
    for (const args of attempts) {
      await runFfmpeg(args);
      outSize = (await stat(outputPath)).size;
      if (outSize <= TARGET_BYTES) break;
    }

    if (outSize > TARGET_BYTES) {
      return NextResponse.json(
        {
          error: `Could not compress under 48 MB (got ${(outSize / (1024 * 1024)).toFixed(1)} MB). Try a shorter clip.`,
        },
        { status: 422 }
      );
    }

    const bytes = await readFile(outputPath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(bytes.length),
        "X-Hero-Compressed": "1",
        "X-Hero-Bytes": String(bytes.length),
      },
    });
  } catch (caught) {
    console.error("[compress-hero]", caught);
    const message =
      caught instanceof Error ? caught.message : "Compression failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
