import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, image optimizer,
     * and large hero compress uploads (proxy body buffer would truncate them).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/admin/compress-hero|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
