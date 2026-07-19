"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMounted } from "@/lib/hooks";
import { selectCartCount, useCartStore } from "@/lib/store/cart-store";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { Logo } from "./Logo";

const NAV = [
  { href: "/shop", label: "Collection" },
  { href: "/shop?section=new-arrivals", label: "New In" },
  { href: "/shop?section=on-sale", label: "On Sale" },
];

/* Height of the mobile bottom bar (h-14) — content above it needs this offset. */
export const MOBILE_BAR_OFFSET = "calc(3.5rem + env(safe-area-inset-bottom))";

export function Header() {
  const router = useRouter();
  const mounted = useMounted();
  const count = useCartStore(selectCartCount);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[4.25rem] max-w-[90rem] items-center justify-between px-5 sm:h-[5.25rem] sm:px-10">
          {/* Desktop nav — left */}
          <nav aria-label="Main" className="hidden flex-1 items-center gap-9 md:flex">
            {NAV.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link group relative">
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Logo — always centered */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo size="header" priority />
          </div>

          {/* Cart — always at the far right; Admin link is desktop-only */}
          <div className="flex flex-1 items-center justify-end gap-5">
            <Link href="/admin" className="nav-link group relative hidden md:inline-block">
              Admin
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
            </Link>
            <button
              onClick={openDrawer}
              aria-label={`Cart${mounted && count > 0 ? `, ${count} items` : ""}`}
              className="relative flex size-10 items-center justify-center text-ink/70 transition-colors duration-300 hover:text-ink"
            >
              <CartIcon width={19} height={19} strokeWidth={1.5} />
              <AnimatePresence>
                {mounted && count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="absolute -right-0.5 top-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu sheet — slides up above the bottom bar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm md:hidden"
              aria-hidden
            />
            <motion.nav
              aria-label="Mobile"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="fixed inset-x-0 z-40 border-t border-ink/10 bg-paper px-6 pb-4 pt-2 md:hidden"
              style={{ bottom: MOBILE_BAR_OFFSET }}
            >
              <div className="mx-auto mb-1 mt-2 h-0.5 w-10 rounded-full bg-ink/15" aria-hidden />
              {NAV.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between border-b border-ink/8 py-5 last:border-0"
                  >
                    <span className="font-display text-2xl font-medium text-ink">
                      {link.label}
                    </span>
                    <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/35">
                      0{i + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + NAV.length * 0.06 }}
              >
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between py-5"
                >
                  <span className="font-display text-2xl font-medium text-ink/60">
                    Admin
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/35">
                    0{NAV.length + 1}
                  </span>
                </Link>
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Mobile search sheet — slides up above the bottom bar */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm md:hidden"
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-label="Search"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="fixed inset-x-0 z-40 border-t border-ink/10 bg-paper px-6 pb-6 pt-2 md:hidden"
              style={{ bottom: MOBILE_BAR_OFFSET }}
            >
              <div className="mx-auto mb-4 mt-2 h-0.5 w-10 rounded-full bg-ink/15" aria-hidden />
              <form onSubmit={submitSearch} className="flex gap-3">
                <div className="relative min-w-0 flex-1">
                  <SearchIcon
                    width={16}
                    height={16}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
                  />
                  <input
                    type="search"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search the collection…"
                    aria-label="Search products"
                    className="w-full border border-ink/15 bg-surface py-3.5 pl-11 pr-4 text-[13px] text-ink outline-none transition-colors duration-300 placeholder:text-ink/30 focus:border-ink"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 bg-ink px-6 text-[10px] font-medium uppercase tracking-[0.25em] text-white"
                >
                  Go
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar — menu + search; the bag lives in the header */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid h-14 grid-cols-2">
          <button
            onClick={() => {
              setSearchOpen(false);
              setOpen((v) => !v);
            }}
            aria-label={open ? "Close menu" : "Menu"}
            aria-expanded={open}
            className="flex flex-col items-center justify-center gap-1 text-ink/70 transition-colors active:text-ink"
          >
            {open ? (
              <CloseIcon width={18} height={18} strokeWidth={1.5} />
            ) : (
              <MenuIcon width={18} height={18} strokeWidth={1.5} />
            )}
            <span className="text-[8px] font-medium uppercase tracking-[0.3em]">
              Menu
            </span>
          </button>

          <button
            onClick={() => {
              setOpen(false);
              setSearchOpen((v) => !v);
            }}
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            className="flex flex-col items-center justify-center gap-1 border-l border-ink/10 text-ink/70 transition-colors active:text-ink"
          >
            {searchOpen ? (
              <CloseIcon width={18} height={18} strokeWidth={1.5} />
            ) : (
              <SearchIcon width={18} height={18} strokeWidth={1.5} />
            )}
            <span className="text-[8px] font-medium uppercase tracking-[0.3em]">
              Search
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
