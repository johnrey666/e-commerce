"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { selectCartTotal, useCartStore } from "@/lib/store/cart-store";

export default function CartPage() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore(selectCartTotal);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Your Cart
      </motion.h1>

      {!mounted ? null : items.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl bg-white py-20 text-center shadow-card">
          <p className="font-display text-xl font-bold">Nothing on the hook yet</p>
          <p className="mt-2 text-sm text-muted">
            Every piece is one of one — don&apos;t sleep on a good catch.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-brand px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Browse the rack
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <ul className="divide-y divide-line rounded-3xl bg-white px-6 shadow-card">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex gap-4 py-5"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="block h-24 w-20 shrink-0 overflow-hidden rounded-xl"
                >
                  <ProductImage image={item.image} alt={item.name} />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/product/${item.productId}`}
                        className="font-medium hover:text-brand"
                      >
                        {item.name}
                      </Link>
                      {item.size && (
                        <p className="text-xs text-muted">Size: {item.size}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size)}
                      aria-label={`Remove ${item.name}`}
                      className="text-muted transition-colors hover:text-brand"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2 rounded-full border border-line px-1.5 py-1">
                      <button
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="grid size-7 place-items-center rounded-full hover:bg-cream"
                      >
                        <MinusIcon width={14} height={14} />
                      </button>
                      <span className="min-w-5 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(item.productId, item.size, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="grid size-7 place-items-center rounded-full hover:bg-cream"
                      >
                        <PlusIcon width={14} height={14} />
                      </button>
                    </div>
                    <span className="font-display font-bold">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total</span>
              <span className="font-display text-2xl font-bold">
                {formatPrice(total)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Delivery to your address · payment via GCash.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/checkout"
                className="flex-1 rounded-full bg-brand py-3.5 text-center font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Proceed to checkout
              </Link>
              <Link
                href="/shop"
                className="flex-1 rounded-full border border-line py-3.5 text-center font-semibold transition-colors hover:border-ink"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
