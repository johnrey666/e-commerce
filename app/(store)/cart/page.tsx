"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import {
  cartRoomForProduct,
  selectCartTotal,
  useCartStore,
} from "@/lib/store/cart-store";

export default function CartPage() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore(selectCartTotal);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="rule-diamond mx-auto max-w-sm">
          <p className="eyebrow">Good Catch</p>
        </div>
        <h1 className="section-title mt-5">Your Bag</h1>
      </motion.div>

      {!mounted ? null : items.length === 0 ? (
        <div className="mt-14 grid place-items-center border border-ink/10 bg-surface py-24 text-center">
          <p className="font-display text-2xl font-medium text-ink">
            Nothing on the hook yet
          </p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink/45">
            Every piece is one of one — don&apos;t let a good catch get away.
          </p>
          <Link href="/shop" className="btn-primary mt-8">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-8">
          <ul className="divide-y divide-ink/8 border-y border-ink/10">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex gap-6 py-7"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="block h-28 w-[88px] shrink-0 overflow-hidden bg-brand-soft"
                >
                  <ProductImage image={item.image} alt={item.name} />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/product/${item.productId}`}
                        className="font-display text-lg font-medium text-ink transition-colors hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      {item.size && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink/40">
                          Size {item.size}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size)}
                      aria-label={`Remove ${item.name}`}
                      className="text-ink/30 transition-colors hover:text-accent"
                    >
                      <TrashIcon width={16} height={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-1 border border-ink/15 px-1.5 py-0.5">
                      <button
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="grid size-7 place-items-center text-ink/60 transition-colors hover:text-ink"
                      >
                        <MinusIcon width={13} height={13} strokeWidth={1.5} />
                      </button>
                      <span className="min-w-5 text-center text-[13px] text-ink">
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
                        aria-label="Increase quantity"
                        className="grid size-7 place-items-center text-ink/60 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <PlusIcon width={13} height={13} strokeWidth={1.5} />
                      </button>
                    </div>
                    <span className="text-[14px] font-medium tracking-[0.05em] text-ink">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border border-ink/10 bg-surface p-8">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/45">
                Total
              </span>
              <span className="font-display text-3xl font-medium text-ink">
                {formatPrice(total)}
              </span>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-ink/35">
              Shipping calculated at checkout · GCash / PayMongo
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/checkout" className="btn-primary flex-1 text-center">
                Proceed to Checkout
              </Link>
              <Link href="/shop" className="btn-secondary flex-1 text-center">
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
