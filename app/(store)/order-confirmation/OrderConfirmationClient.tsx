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
    <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8 sm:py-28">
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="mx-auto grid size-20 place-items-center rounded-full border border-ink/15 bg-ink text-paper"
      >
        <CheckIcon width={32} height={32} strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="eyebrow mt-10">With Gratitude</p>
        <h1 className="section-title mt-4">Your order is received</h1>
        <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-ink/50">
          Thank you for shopping with Good Catch. We&apos;ll contact you
          shortly to confirm payment and let you know once your piece is on
          its way.
        </p>
      </motion.div>

      {mounted && order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 border border-ink/10 bg-surface p-8 text-left"
        >
          <div className="flex items-center justify-between border-b border-ink/10 pb-5">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                Order number
              </p>
              <p className="mt-1 font-display text-xl font-medium text-ink">
                {order.id}
              </p>
            </div>
            <span className="border border-ink/20 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/70">
              {order.status}
            </span>
          </div>
          <ul className="divide-y divide-ink/8">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex justify-between py-4 text-[13px] text-ink/70"
              >
                <span>
                  {item.name}
                  {item.size ? ` (${item.size})` : ""} × {item.quantity}
                </span>
                <span className="font-medium text-ink">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-ink/10 pt-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/45">
              Total
            </span>
            <span className="font-display text-2xl font-medium text-ink">
              {formatPrice(order.total)}
            </span>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-ink/40">
            A confirmation was &quot;sent&quot; to {order.customer.email} —
            placeholder, email sending comes with the real backend.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-12"
      >
        <Link href="/shop" className="btn-primary">
          Continue Browsing
        </Link>
      </motion.div>
    </div>
  );
}
