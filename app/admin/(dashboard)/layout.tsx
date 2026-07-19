"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { useMounted } from "@/lib/hooks";
import { useAuthStore } from "@/lib/store/auth-store";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/landing", label: "Landing Page" },
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
  const initialized = useAuthStore((s) => s.initialized);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && initialized && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [mounted, initialized, isAdmin, router]);

  if (!mounted || !initialized || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
          Checking access
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[90rem] items-center justify-between gap-4 px-5 sm:h-20 sm:px-10">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-4 w-px bg-ink/15 sm:block" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-ink/45">
              Atelier · Admin
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/" className="nav-link group relative hidden sm:inline-flex">
              View Store
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
            </Link>
            <button
              onClick={async () => {
                await logout();
                router.push("/admin/login");
              }}
              className="border border-ink/15 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/60 transition-all duration-300 hover:border-ink hover:text-ink"
            >
              Log Out
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
            aria-expanded={menuOpen}
            className="grid size-10 place-items-center border border-ink/15 text-ink/65 md:hidden"
          >
            {menuOpen ? (
              <CloseIcon width={18} height={18} strokeWidth={1.5} />
            ) : (
              <MenuIcon width={18} height={18} strokeWidth={1.5} />
            )}
          </button>
        </div>
        <nav
          aria-label="Admin"
          className="no-scrollbar mx-auto hidden max-w-[90rem] gap-8 overflow-x-auto px-5 pb-4 md:flex sm:px-10"
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
                className={`group relative whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.26em] transition-colors duration-300 ${
                  active ? "text-ink" : "text-ink/45 hover:text-ink"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-brand transition-all duration-500 ${
                    active ? "w-full" : "w-0 group-hover:w-full group-hover:bg-ink"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              aria-label="Admin mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-ink/10 bg-paper md:hidden"
            >
              <div className="px-5 py-3">
                {ADMIN_LINKS.map((link) => {
                  const active =
                    link.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between border-b border-ink/8 py-4 text-[11px] font-medium uppercase tracking-[0.24em] ${
                        active ? "text-brand" : "text-ink/65"
                      }`}
                    >
                      {link.label}
                      <span aria-hidden>→</span>
                    </Link>
                  );
                })}
                <div className="grid grid-cols-2 gap-3 py-4">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="border border-ink/15 px-3 py-3 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-ink/65"
                  >
                    View Store
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      router.push("/admin/login");
                    }}
                    className="border border-ink/15 px-3 py-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/65"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main className="mx-auto max-w-[90rem] px-5 py-10 sm:px-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
