"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OrderChatModal } from "@/components/OrderChatModal";
import { OrderItemReview } from "@/components/OrderItemReview";
import { ProductImage } from "@/components/ProductImage";
import { StarRating } from "@/components/StarRating";
import { ChatIcon, ChevronDownIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { fetchReviewsForOrders } from "@/lib/reviews";
import { useAuthStore } from "@/lib/store/auth-store";
import { useOrderStore } from "@/lib/store/order-store";
import type { Order, OrderStatus, PaymentStatus, ProductReview } from "@/lib/types";

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
  const [reviews, setReviews] = useState<ProductReview[]>([]);

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

  const orderIdsKey = useMemo(
    () => orders.map((o) => o.id).join(","),
    [orders]
  );

  useEffect(() => {
    if (!isCustomer || orders.length === 0) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchReviewsForOrders(orders.map((o) => o.id));
        if (!cancelled) setReviews(rows);
      } catch {
        if (!cancelled) setReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCustomer, orderIdsKey, orders]);

  const reviewFor = (orderId: string, productId: string) =>
    reviews.find((r) => r.orderId === orderId && r.productId === productId);

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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
      <div>
        <p className="eyebrow">Your Orders</p>
        <h1 className="mt-3 font-display text-[1.85rem] font-medium text-ink sm:text-[2.2rem]">
          Order history
        </h1>
        <p className="mt-2 text-[12px] text-ink/45 sm:text-[13px]">
          Tap a card for details. Paid orders can be rated below each piece.
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <p className="mt-10 text-[13px] text-ink/45">Fetching your orders…</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 border border-ink/10 bg-surface px-6 py-14 text-center">
          <p className="font-display text-xl font-medium text-ink">
            No orders yet
          </p>
          <Link href="/shop" className="btn-primary mt-6 inline-flex">
            Browse the Collection
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {orders.map((order, index) => {
            const expanded = expandedId === order.id;
            const cover = order.items[0]?.image ?? "";
            const reviewerName =
              `${order.customer.firstName} ${order.customer.lastName.charAt(0)}.`.trim();
            const itemReviews = order.items
              .map((item) => reviewFor(order.id, item.productId))
              .filter(Boolean) as ProductReview[];
            const avg =
              itemReviews.length > 0
                ? itemReviews.reduce((a, r) => a + r.rating, 0) /
                  itemReviews.length
                : null;

            return (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.4 }}
                className={`group/card overflow-hidden border border-ink/10 bg-surface ${
                  expanded ? "col-span-2 md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full text-left"
                >
                  <div className="relative aspect-square overflow-hidden bg-brand-soft">
                    {cover ? (
                      <ProductImage
                        image={cover}
                        alt={order.items[0]?.name ?? order.id}
                        className="[&_img]:transition-transform [&_img]:duration-700 [&_img]:group-hover/card:scale-[1.04]"
                      />
                    ) : null}
                    <div className="absolute left-1.5 top-1.5 flex max-w-[calc(100%-0.75rem)] flex-wrap gap-1">
                      <span
                        className={`px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.14em] ${PAYMENT_STYLES[order.paymentStatus]}`}
                      >
                        {order.paymentStatus}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.14em] ${STATUS_STYLES[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="px-2.5 py-2.5 sm:px-3 sm:py-3">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="truncate font-display text-[13px] font-medium leading-tight text-ink sm:text-sm">
                        {order.id}
                      </p>
                      <ChevronDownIcon
                        width={12}
                        height={12}
                        strokeWidth={1.5}
                        className={`mt-0.5 shrink-0 text-ink/35 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-ink/40">
                      {order.items.map((i) => i.name).join(", ")}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <p className="font-display text-sm font-medium text-ink sm:text-[15px]">
                        {formatPrice(order.total)}
                      </p>
                      {avg != null ? (
                        <StarRating value={Math.round(avg)} size={10} />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-ink/30">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
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
                      <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
                        <ul className="space-y-3 text-[12px]">
                          {order.items.map((item) => (
                            <li
                              key={`${item.productId}-${item.size ?? ""}`}
                              className="text-ink/70"
                            >
                              <div className="flex justify-between gap-2">
                                <span>
                                  {item.name}
                                  {item.size ? ` (${item.size})` : ""} ×{" "}
                                  {item.quantity}
                                </span>
                                <span className="shrink-0 font-medium text-ink">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                              {order.paymentStatus === "Paid" && (
                                <OrderItemReview
                                  compact
                                  orderId={order.id}
                                  productId={item.productId}
                                  productName={item.name}
                                  reviewerName={reviewerName}
                                  existing={reviewFor(
                                    order.id,
                                    item.productId
                                  )}
                                  onSaved={(review) => {
                                    setReviews((prev) => {
                                      const without = prev.filter(
                                        (r) =>
                                          !(
                                            r.orderId === review.orderId &&
                                            r.productId === review.productId
                                          )
                                      );
                                      return [...without, review];
                                    });
                                  }}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-ink/8 pt-3 text-[11px] leading-relaxed text-ink/55">
                          <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-ink/35">
                            Delivery
                          </p>
                          <p className="mt-1.5">
                            {order.customer.firstName} {order.customer.lastName}
                          </p>
                          {order.customer.street ? (
                            <p>{order.customer.street}</p>
                          ) : null}
                          <p>
                            {order.customer.barangay}, {order.customer.city}
                          </p>
                          <p>
                            {order.customer.region} ·{" "}
                            {order.customer.shippingCarrier}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatOrder(order)}
                          className="flex w-full items-center justify-center gap-2 border border-ink/15 py-2.5 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/65 transition-colors hover:border-ink hover:text-ink"
                        >
                          <ChatIcon width={12} height={12} strokeWidth={1.5} />
                          Chat
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
          orderItems={chatOrder.items}
          orderTotal={chatOrder.total}
          senderId={userId}
          senderRole="user"
        />
      )}
    </div>
  );
}
