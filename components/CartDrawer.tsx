"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import {
  cartRoomForProduct,
  selectCartTotal,
  useCartStore,
} from "@/lib/store/cart-store";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import { ProductImage } from "./ProductImage";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore(selectCartTotal);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink/10 bg-paper"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-7 py-6">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
                Your Bag{" "}
                <span className="text-ink/40">
                  ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="grid size-9 place-items-center text-ink/50 transition-colors duration-300 hover:text-ink"
              >
                <CloseIcon strokeWidth={1.5} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="font-display text-2xl font-medium text-ink">
                  Your bag is empty
                </p>
                <p className="text-[13px] leading-relaxed text-ink/45">
                  Every piece is one of one.
                  <br />
                  Don&apos;t let a good catch get away.
                </p>
                <button onClick={close} className="btn-primary mt-3">
                  Continue Browsing
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ink/8 overflow-y-auto px-7">
                  {items.map((item) => (
                    <motion.li
                      key={`${item.productId}-${item.size ?? ""}`}
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-5 py-6"
                    >
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={close}
                        className="block h-24 w-[76px] shrink-0 overflow-hidden bg-brand-soft"
                      >
                        <ProductImage image={item.image} alt={item.name} />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={close}
                            className="font-display text-[15px] font-medium leading-snug text-ink transition-colors hover:text-accent"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.size)}
                            aria-label={`Remove ${item.name}`}
                            className="text-ink/30 transition-colors hover:text-accent"
                          >
                            <TrashIcon width={14} height={14} strokeWidth={1.5} />
                          </button>
                        </div>
                        {item.size && (
                          <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                            Size {item.size}
                          </span>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center gap-1 border border-ink/15 px-1">
                            <button
                              onClick={() =>
                                setQuantity(item.productId, item.size, item.quantity - 1)
                              }
                              aria-label="Decrease"
                              className="grid size-7 place-items-center text-ink/60 transition-colors hover:text-ink"
                            >
                              <MinusIcon width={11} height={11} strokeWidth={1.5} />
                            </button>
                            <span className="min-w-5 text-center text-[12px] text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={
                                cartRoomForProduct(
                                  items,
                                  item.productId,
                                  item.stock ?? item.quantity
                                ) <= 0
                              }
                              onClick={() =>
                                setQuantity(item.productId, item.size, item.quantity + 1)
                              }
                              aria-label="Increase"
                              className="grid size-7 place-items-center text-ink/60 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <PlusIcon width={11} height={11} strokeWidth={1.5} />
                            </button>
                          </div>
                          <span className="text-[13px] font-medium tracking-[0.05em] text-ink">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <div className="space-y-4 border-t border-ink/10 p-7">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/45">
                      Total
                    </span>
                    <span className="font-display text-2xl font-medium text-ink">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink/35">
                    Shipping calculated at checkout · GCash / PayMongo
                  </p>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="btn-primary block w-full text-center"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="btn-secondary block w-full text-center"
                  >
                    View Bag
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
