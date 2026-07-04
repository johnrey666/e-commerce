"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { selectCartTotal, useCartStore } from "@/lib/store/cart-store";
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
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-brand/20 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-brand/10 bg-white"
          >
            <div className="flex items-center justify-between border-b border-brand/10 px-5 py-4">
              <h2 className="text-base font-semibold text-brand-dark">
                Bag{" "}
                <span className="text-sm font-normal text-brand/45">
                  ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="grid size-9 place-items-center text-brand/50 transition-colors hover:text-brand"
              >
                <CloseIcon />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-base font-medium text-brand-dark">
                  Your bag is empty
                </p>
                <p className="text-sm text-brand/45">
                  Browse the shop and add something you love.
                </p>
                <button onClick={close} className="btn-primary mt-2">
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-brand/10 overflow-y-auto px-5">
                  {items.map((item) => (
                    <motion.li
                      key={`${item.productId}-${item.size ?? ""}`}
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4 py-4"
                    >
                      <Link
                        href={`/product/${item.productId}`}
                        onClick={close}
                        className="block h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-soft"
                      >
                        <ProductImage image={item.image} alt={item.name} />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            onClick={close}
                            className="text-sm font-medium text-brand-dark hover:text-brand"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.size)}
                            aria-label={`Remove ${item.name}`}
                            className="text-brand/35 hover:text-brand"
                          >
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                        {item.size && (
                          <span className="text-xs text-brand/45">
                            Size {item.size}
                          </span>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1 rounded-full border border-brand/15 px-1">
                            <button
                              onClick={() =>
                                setQuantity(item.productId, item.size, item.quantity - 1)
                              }
                              aria-label="Decrease"
                              className="grid size-7 place-items-center rounded-full text-brand hover:bg-brand-soft"
                            >
                              <MinusIcon width={12} height={12} />
                            </button>
                            <span className="min-w-4 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(item.productId, item.size, item.quantity + 1)
                              }
                              aria-label="Increase"
                              className="grid size-7 place-items-center rounded-full text-brand hover:bg-brand-soft"
                            >
                              <PlusIcon width={12} height={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-brand">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-brand/10 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand/45">Total</span>
                    <span className="text-xl font-semibold text-brand-dark">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-xs text-brand/40">
                    Delivery included · pay via GCash at checkout
                  </p>
                  <Link href="/checkout" onClick={close} className="btn-primary block w-full text-center">
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={close}
                    className="btn-secondary block w-full text-center"
                  >
                    View bag
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
