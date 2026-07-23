import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase auth session on each request.
 * Used by the root `proxy.ts` (Next.js 16+ network boundary).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth work until env is configured so the store still loads.
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validates JWT; also refreshes the session when needed.
  // Stale/revoked refresh cookies (e.g. after logout elsewhere) throw
  // refresh_token_not_found — clear them so the request continues as guest.
  const { error } = await supabase.auth.getClaims();
  if (
    error &&
    (error.code === "refresh_token_not_found" ||
      error.message?.toLowerCase().includes("refresh token"))
  ) {
    // Local-only: token is already invalid server-side.
    await supabase.auth.signOut({ scope: "local" });
  }

  return supabaseResponse;
}
