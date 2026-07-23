"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderSnackbar } from "@/components/HeaderSnackbar";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { CloseIcon, MenuIcon, UserIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { useMounted } from "@/lib/hooks";
import { useAuthStore } from "@/lib/store/auth-store";
import { useProfileStore } from "@/lib/store/profile-store";
import { useToastStore } from "@/lib/store/toast-store";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/landing", label: "Landing" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/team", label: "Admins" },
];

const MOBILE_BAR_OFFSET = "calc(3.5rem + env(safe-area-inset-bottom))";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const initialized = useAuthStore((s) => s.initialized);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const showToast = useToastStore((s) => s.show);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (userId) void loadProfile(userId);
  }, [userId, loadProfile]);

  useEffect(() => {
    if (mounted && initialized && !isAdmin) {
      router.replace("/login");
    }
  }, [mounted, initialized, isAdmin, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--color-cream)_0%,var(--color-paper)_28%)]">
      <HeaderSnackbar />
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[4.25rem] max-w-[90rem] items-center justify-between px-5 sm:h-[5rem] sm:px-10">
          {/* Left — atelier label on desktop */}
          <div className="hidden flex-1 items-center gap-4 md:flex">
            <span className="h-4 w-px bg-ink/12" aria-hidden />
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-ink/40">
                Atelier
              </p>
              <p className="mt-0.5 text-[11px] text-ink/55">{email}</p>
            </div>
          </div>
          <div className="flex-1 md:hidden" aria-hidden />

          {/* Logo — centered like the store */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo size="header" priority />
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
            <Link href="/" className="nav-link group relative hidden md:inline-block">
              View Store
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
            </Link>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Profile"
              className="hidden size-10 place-items-center border border-ink/12 text-ink/60 transition-colors hover:border-ink hover:text-ink md:grid"
            >
              <UserIcon width={18} height={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={async () => {
                await logout();
                showToast("Logged out successfully");
                router.push("/login");
              }}
              className="hidden border border-ink/12 px-5 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55 transition-all duration-300 hover:border-ink hover:text-ink md:inline-block"
            >
              Log Out
            </button>
          </div>
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
                  active ? "text-ink" : "text-ink/40 hover:text-ink"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-brand transition-all duration-500 ${
                    active
                      ? "w-full"
                      : "w-0 group-hover:w-full group-hover:bg-ink"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[90rem] px-5 py-10 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-10 sm:py-14 md:pb-14">
        {children}
      </main>

      {/* Mobile menu sheet — above bottom bar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/25 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              aria-label="Admin mobile"
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 z-50 max-h-[70vh] overflow-y-auto border-t border-ink/10 bg-paper md:hidden"
              style={{ bottom: MOBILE_BAR_OFFSET }}
            >
              <div className="px-5 py-2">
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
                      showToast("Logged out successfully");
                      router.push("/login");
                    }}
                    className="border border-ink/15 px-3 py-3 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/65"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-paper/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid h-14 grid-cols-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Menu"}
            aria-expanded={menuOpen}
            className="flex flex-col items-center justify-center gap-1 text-ink/70 transition-colors active:text-ink"
          >
            {menuOpen ? (
              <CloseIcon width={18} height={18} strokeWidth={1.5} />
            ) : (
              <MenuIcon width={18} height={18} strokeWidth={1.5} />
            )}
            <span className="text-[8px] font-medium uppercase tracking-[0.3em]">
              Menu
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen(true);
            }}
            aria-label="Profile"
            className="flex flex-col items-center justify-center gap-1 border-l border-ink/10 text-ink/70 transition-colors active:text-ink"
          >
            <UserIcon width={18} height={18} strokeWidth={1.5} />
            <span className="text-[8px] font-medium uppercase tracking-[0.3em]">
              Profile
            </span>
          </button>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
