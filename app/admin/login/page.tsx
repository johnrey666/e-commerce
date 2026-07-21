"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Admin access uses the shared /login page. */
export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?next=/admin");
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
        Redirecting to sign in…
      </p>
    </div>
  );
}
