import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  }

  return { user, supabase };
}

function sanitizePath(p: string): string | null {
  const cleaned = p.replace(/^\/+/, "").trim();
  if (!cleaned || cleaned.includes("..") || cleaned.length > 512) return null;
  return cleaned;
}

/**
 * Permanently delete objects from the landing-media bucket.
 * Prefers service role; falls back to the admin session client.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase: userClient } = auth;

  try {
    const body = (await request.json()) as {
      paths?: unknown;
      prefix?: unknown;
      keepPath?: unknown;
    };

    const explicitPaths = Array.isArray(body.paths)
      ? body.paths
          .filter((p): p is string => typeof p === "string")
          .map(sanitizePath)
          .filter((p): p is string => Boolean(p))
      : [];

    const prefix =
      typeof body.prefix === "string" ? sanitizePath(body.prefix) : null;
    const keepPath =
      typeof body.keepPath === "string" ? sanitizePath(body.keepPath) : null;

    let storage = userClient.storage;
    let usedServiceRole = false;
    try {
      storage = createServiceClient().storage;
      usedServiceRole = true;
    } catch (err) {
      console.warn(
        "[delete-landing-media] service role unavailable, using admin session:",
        err instanceof Error ? err.message : err
      );
    }

    const toRemove = new Set<string>(explicitPaths);

    if (prefix) {
      const { data: listed, error: listError } = await storage
        .from("landing-media")
        .list(prefix, { limit: 1000, offset: 0 });

      if (listError) {
        return NextResponse.json(
          {
            error: `Could not list ${prefix}: ${listError.message}${
              usedServiceRole
                ? ""
                : " (also add SUPABASE_SERVICE_ROLE_KEY to .env.local)"
            }`,
          },
          { status: 500 }
        );
      }

      for (const entry of listed ?? []) {
        if (!entry.name || entry.name.endsWith("/")) continue;
        const full = `${prefix}/${entry.name}`;
        if (keepPath && full === keepPath) continue;
        toRemove.add(full);
      }
    }

    const paths = [...toRemove].filter((p) => !keepPath || p !== keepPath);
    if (paths.length === 0) {
      return NextResponse.json({ removed: 0, usedServiceRole });
    }

    const { error, data } = await storage.from("landing-media").remove(paths);

    if (error) {
      console.error("[delete-landing-media] remove failed", error, paths);
      return NextResponse.json(
        {
          error: `${error.message}${
            usedServiceRole
              ? ""
              : " — add SUPABASE_SERVICE_ROLE_KEY to .env.local and run migration 011."
          }`,
        },
        { status: 500 }
      );
    }

    const removed = Array.isArray(data) ? data.length : paths.length;
    console.info("[delete-landing-media] removed", removed, paths);

    return NextResponse.json({ removed, paths, usedServiceRole });
  } catch (caught) {
    console.error("[delete-landing-media]", caught);
    return NextResponse.json(
      {
        error:
          caught instanceof Error ? caught.message : "Could not delete media.",
      },
      { status: 500 }
    );
  }
}
