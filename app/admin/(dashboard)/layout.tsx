"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useMounted } from "@/lib/hooks";
import { useAuthStore } from "@/lib/store/auth-store";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (mounted && !isAdmin) router.replace("/admin/login");
  }, [mounted, isAdmin, router]);

  if (!mounted || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-brand"
            >
              View store
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
            >
              Log out
            </button>
          </div>
        </div>
        <nav
          aria-label="Admin"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
        >
          {ADMIN_LINKS.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
