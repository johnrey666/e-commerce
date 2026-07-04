"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useMounted } from "@/lib/hooks";
import { selectCartCount, useCartStore } from "@/lib/store/cart-store";
import { CartIcon, CloseIcon, MenuIcon } from "./icons";
import { Logo } from "./Logo";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?section=new-arrivals", label: "New" },
  { href: "/shop?section=on-sale", label: "Sale" },
];

export function Header() {
  const mounted = useMounted();
  const count = useCartStore(selectCartCount);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand/8 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:h-[4.75rem] sm:px-8">
        {/* Desktop nav — left */}
        <nav aria-label="Main" className="hidden flex-1 items-center gap-10 md:flex">
          {NAV.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link group relative">
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Logo — center on desktop, left on mobile */}
        <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
          <Logo size="header" priority />
        </div>

        {/* Cart + mobile menu */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={openDrawer}
            aria-label={`Cart${mounted && count > 0 ? `, ${count} items` : ""}`}
            className="relative flex size-10 items-center justify-center text-brand/70 transition-colors duration-200 hover:text-brand"
          >
            <CartIcon width={20} height={20} />
            <AnimatePresence>
              {mounted && count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Menu"}
            className="grid size-10 place-items-center text-brand/70 md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-brand/8 md:hidden"
          >
            <div className="flex flex-col px-5 py-2">
              {NAV.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-brand/5 py-4 text-sm font-medium text-brand/60 last:border-0 hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
