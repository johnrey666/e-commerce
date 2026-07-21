"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { fetchOrderById } from "@/lib/orders";
import { useMounted } from "@/lib/hooks";
import type { Order } from "@/lib/types";

async function verifyPayment(orderId: string): Promise<boolean> {
  const res = await fetch("/api/checkout/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  const data = (await res.json()) as { paymentStatus?: string };
  return data.paymentStatus === "Paid";
}

export function OrderConfirmationClient() {
  const mounted = useMounted();
  const orderId = useSearchParams().get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setVerifying(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      // PayMongo can lag briefly after redirect — retry verify a few times.
      for (let attempt = 0; attempt < 6; attempt++) {
        if (cancelled) return;
        try {
          const ok = await verifyPayment(orderId);
          if (ok) {
            if (!cancelled) setPaid(true);
            break;
          }
        } catch {
          // keep retrying
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      const fetched = await fetchOrderById(orderId);
      if (!cancelled) {
        setOrder(fetched);
        if (fetched?.paymentStatus === "Paid") setPaid(true);
        setVerifying(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

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
        <h1 className="section-title mt-4">
          {verifying
            ? "Confirming payment…"
            : paid
              ? "Payment successful"
              : "Order received"}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-ink/50">
          {paid
            ? "Thank you for shopping with Good Catch. Your order is pending fulfillment — we’ll mark it out for delivery once it’s shipped."
            : "We’re confirming your PayMongo payment. If you just paid, this page will update shortly. You can also check My Orders."}
        </p>
      </motion.div>

      {mounted && order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 border border-ink/10 bg-surface p-8 text-left"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-5">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                Order number
              </p>
              <p className="mt-1 font-display text-xl font-medium text-ink">
                {order.id}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="border border-ink/20 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/70">
                {order.paymentStatus}
              </span>
              <span className="border border-ink/20 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/70">
                {order.status}
              </span>
            </div>
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
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-12 flex flex-wrap justify-center gap-4"
      >
        <Link href="/account/orders" className="btn-primary">
          My Orders
        </Link>
        <Link
          href="/shop"
          className="border border-ink/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/70 hover:border-ink hover:text-ink"
        >
          Continue Browsing
        </Link>
      </motion.div>
    </div>
  );
}
