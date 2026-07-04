"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useOrderStore } from "@/lib/store/order-store";

export function OrderConfirmationClient() {
  const mounted = useMounted();
  const orderId = useSearchParams().get("order");
  const order = useOrderStore((s) => s.orders.find((o) => o.id === orderId));

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="mx-auto grid size-20 place-items-center rounded-full bg-brand text-white"
      >
        <CheckIcon width={38} height={38} strokeWidth={2.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Order received!
        </h1>
        <p className="mt-3 text-muted">
          Thanks for shopping at Good Catch. We&apos;ll contact you shortly to
          confirm payment and notify you when your order is out for delivery.
        </p>
      </motion.div>

      {mounted && order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-3xl bg-white p-6 text-left shadow-card"
        >
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-xs text-muted">Order number</p>
              <p className="font-display text-lg font-bold">{order.id}</p>
            </div>
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
              {order.status}
            </span>
          </div>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex justify-between py-3 text-sm"
              >
                <span>
                  {item.name}
                  {item.size ? ` (${item.size})` : ""} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line pt-4">
            <span className="font-medium">Total</span>
            <span className="font-display text-xl font-bold">
              {formatPrice(order.total)}
            </span>
          </div>
          <p className="mt-4 text-xs text-muted">
            A confirmation was &quot;sent&quot; to {order.customer.email} —
            placeholder, email sending comes with the real backend.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-8"
      >
        <Link
          href="/shop"
          className="inline-block rounded-full bg-brand px-8 py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Keep browsing
        </Link>
      </motion.div>
    </div>
  );
}
