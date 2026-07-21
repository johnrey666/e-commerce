"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderChatModal } from "@/components/OrderChatModal";
import { ProductImage } from "@/components/ProductImage";
import { ChatIcon, ChevronDownIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useAuthStore } from "@/lib/store/auth-store";
import { useOrderStore } from "@/lib/store/order-store";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-brand-soft text-brand",
  "Out for Delivery": "bg-ink/8 text-ink",
  Delivered: "bg-brand text-white",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  Pending: "border border-ink/20 text-ink/60",
  Paid: "bg-ink text-white",
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const mounted = useMounted();
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const isCustomer = useAuthStore((s) => s.isCustomer);
  const userId = useAuthStore((s) => s.userId);

  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && initialized && !isCustomer) {
      router.replace(`/login?next=${encodeURIComponent("/account/orders")}`);
    }
  }, [mounted, initialized, isCustomer, router]);

  useEffect(() => {
    if (isCustomer) void fetchOrders("mine");
  }, [isCustomer, fetchOrders]);

  if (!mounted || !initialized || !isCustomer || !userId) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-ink/40">
          Loading orders
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <div>
        <p className="eyebrow">Your Orders</p>
        <h1 className="mt-3 font-display text-[2rem] font-medium text-ink sm:text-[2.4rem]">
          Order history
        </h1>
        <p className="mt-2 text-[13px] text-ink/45">
          Tap a card to view delivery details. Chat opens full screen.
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <p className="mt-12 text-[13px] text-ink/45">Fetching your orders…</p>
      ) : orders.length === 0 ? (
        <div className="mt-12 border border-ink/10 bg-surface px-6 py-16 text-center">
          <p className="font-display text-2xl font-medium text-ink">
            No orders yet
          </p>
          <Link href="/shop" className="btn-primary mt-8 inline-flex">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {orders.map((order, index) => {
            const expanded = expandedId === order.id;
            const cover = order.items[0]?.image ?? "";
            return (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.45 }}
                className="group/card overflow-hidden border border-ink/10 bg-surface"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
                    {cover ? (
                      <ProductImage
                        image={cover}
                        alt={order.items[0]?.name ?? order.id}
                        className="[&_img]:transition-transform [&_img]:duration-700 [&_img]:group-hover/card:scale-[1.04]"
                      />
                    ) : null}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span
                        className={`px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.22em] ${PAYMENT_STYLES[order.paymentStatus]}`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.22em] ${STATUS_STYLES[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-4">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-medium text-ink">
                        {order.id}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-ink/45">
                        {order.items.map((i) => i.name).join(", ")}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-ink/35">
                        {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                        {order.customer.shippingCarrier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-medium text-ink">
                        {formatPrice(order.total)}
                      </p>
                      <ChevronDownIcon
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        className={`ml-auto mt-2 text-ink/40 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-ink/10"
                    >
                      <div className="space-y-4 px-4 py-4">
                        <ul className="space-y-2 text-[13px]">
                          {order.items.map((item) => (
                            <li
                              key={`${item.productId}-${item.size ?? ""}`}
                              className="flex justify-between gap-3 text-ink/70"
                            >
                              <span>
                                {item.name}
                                {item.size ? ` (${item.size})` : ""} ×{" "}
                                {item.quantity}
                              </span>
                              <span className="font-medium text-ink">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-ink/8 pt-4 text-[13px] leading-relaxed text-ink/60">
                          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/40">
                            Delivery
                          </p>
                          <p className="mt-2">
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                          <p>{order.customer.contactNumber}</p>
                          <p>{order.customer.email}</p>
                          <p className="mt-2">
                            {order.customer.barangay}, {order.customer.city}
                          </p>
                          <p>
                            {order.customer.region}, {order.customer.postalCode}
                          </p>
                          <p>{order.customer.country}</p>
                          {order.customer.pinnedLocation && (
                            <p className="mt-1 text-ink/40">
                              Pin: {order.customer.pinnedLocation}
                            </p>
                          )}
                          {order.customer.notes && (
                            <p className="mt-1 text-ink/40">
                              Notes: {order.customer.notes}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatOrder(order)}
                          className="flex w-full items-center justify-center gap-2 border border-ink/15 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/70 transition-colors hover:border-ink hover:text-ink"
                        >
                          <ChatIcon width={14} height={14} strokeWidth={1.5} />
                          Chat with seller
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      {chatOrder && (
        <OrderChatModal
          open={Boolean(chatOrder)}
          onClose={() => setChatOrder(null)}
          orderId={chatOrder.id}
          orderLabel={chatOrder.id}
          senderId={userId}
          senderRole="user"
        />
      )}
    </div>
  );
}
