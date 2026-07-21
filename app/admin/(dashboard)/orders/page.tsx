"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OrderChatModal } from "@/components/OrderChatModal";
import { ProductImage } from "@/components/ProductImage";
import { StarRating } from "@/components/StarRating";
import { ChatIcon, ChevronDownIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { fetchReviewsForOrders } from "@/lib/reviews";
import { useAuthStore } from "@/lib/store/auth-store";
import { useOrderStore } from "@/lib/store/order-store";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  ProductReview,
} from "@/lib/types";

const STATUSES: OrderStatus[] = ["Pending", "Out for Delivery", "Delivered"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-brand-soft text-brand",
  "Out for Delivery": "bg-ink/8 text-ink",
  Delivered: "bg-brand text-white",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  Pending: "border border-ink/20 text-ink/60",
  Paid: "bg-ink text-white",
};

export default function AdminOrdersPage() {
  const mounted = useMounted();
  const userId = useAuthStore((s) => s.userId);
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      setSyncing(true);
      try {
        const res = await fetch("/api/checkout/reconcile", { method: "POST" });
        const data = (await res.json()) as {
          markedPaid?: number;
          checked?: number;
        };
        if (!cancelled && data.markedPaid && data.markedPaid > 0) {
          setSyncNote(
            `Synced ${data.markedPaid} newly paid order${data.markedPaid === 1 ? "" : "s"} from PayMongo.`
          );
        }
      } catch {
        // ignore — list still loads
      }
      if (!cancelled) {
        await fetchOrders("all");
        setSyncing(false);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [fetchOrders]);

  const orderIdsKey = useMemo(
    () => orders.map((o) => o.id).join(","),
    [orders]
  );

  useEffect(() => {
    if (orders.length === 0) {
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
  }, [orderIdsKey, orders]);

  const reviewFor = (orderId: string, productId: string) =>
    reviews.find((r) => r.orderId === orderId && r.productId === productId);

  const filtered =
    statusFilter === "All"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The Ledger</p>
          <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
            Orders
            <span className="ml-3 align-middle text-base font-normal text-ink/40">
              {mounted ? orders.length : "…"}
            </span>
          </h1>
        </div>
        <button
          type="button"
          disabled={syncing}
          onClick={async () => {
            setSyncing(true);
            setSyncNote(null);
            try {
              const res = await fetch("/api/checkout/reconcile", {
                method: "POST",
              });
              const data = (await res.json()) as {
                markedPaid?: number;
                checked?: number;
                inventoryApplied?: number;
                error?: string;
              };
              setSyncNote(
                data.error
                  ? data.error
                  : `Checked ${data.checked ?? 0} pending · marked ${data.markedPaid ?? 0} paid · stock updated on ${data.inventoryApplied ?? 0}.`
              );

              await fetchOrders("all");
            } finally {
              setSyncing(false);
            }
          }}
          className="border border-ink/15 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/60 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync Payments"}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-[10px] sm:tracking-[0.24em] ${
              statusFilter === s
                ? "bg-ink text-white"
                : "border border-ink/15 text-ink/50 hover:border-ink hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-ink/40">
        Paid orders only. Use Sync Payments if a successful PayMongo payment is
        missing.
      </p>
      {syncNote && (
        <p className="mt-2 text-[12px] text-ink/55">{syncNote}</p>
      )}

      {mounted && !loading && filtered.length === 0 ? (
        <div className="mt-10 border border-ink/10 bg-surface px-6 py-20 text-center">
          <p className="eyebrow">Quiet For Now</p>
          <p className="mt-4 font-display text-2xl font-medium text-ink">
            No paid orders yet
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink/45">
            After a successful payment, tap Sync Payments if it doesn’t show
            automatically.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {(mounted ? filtered : []).map((order, index) => {
            const expanded = expandedId === order.id;
            const cover = order.items[0]?.image ?? "";
            return (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.35 }}
                className={`group/card overflow-hidden border border-ink/10 bg-surface ${
                  expanded ? "col-span-2 md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  aria-expanded={expanded}
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
                    <p className="mt-0.5 truncate text-[10px] text-ink/45">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="mt-1.5 font-display text-sm font-medium text-ink">
                      {formatPrice(order.total)}
                    </p>
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
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-ink/10"
                    >
                      <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-4">
                        <ul className="space-y-3 text-[12px]">
                          {order.items.map((item) => {
                            const review = reviewFor(
                              order.id,
                              item.productId
                            );
                            return (
                              <li
                                key={`${item.productId}-${item.size ?? ""}`}
                                className="flex gap-2.5"
                              >
                                <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-brand-soft">
                                  {item.image ? (
                                    <ProductImage
                                      image={item.image}
                                      alt={item.name}
                                    />
                                  ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-ink/70">
                                      {item.name}
                                      {item.size ? ` (${item.size})` : ""} ×{" "}
                                      {item.quantity}
                                    </span>
                                    <span className="shrink-0 font-medium text-ink">
                                      {formatPrice(
                                        item.unitPrice * item.quantity
                                      )}
                                    </span>
                                  </div>
                                  {review ? (
                                    <div className="mt-1.5">
                                      <StarRating
                                        value={review.rating}
                                        size={11}
                                      />
                                      {review.body ? (
                                        <p className="mt-0.5 text-[11px] leading-snug text-ink/50">
                                          {review.body}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-[10px] text-ink/30">
                                      No review yet
                                    </p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        <div className="border-t border-ink/8 pt-3 text-[11px] leading-relaxed text-ink/55">
                          <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-ink/35">
                            Customer
                          </p>
                          <p>{order.customer.email}</p>
                          <p>{order.customer.contactNumber}</p>
                          {order.customer.street ? (
                            <p>{order.customer.street}</p>
                          ) : null}
                          <p>
                            {order.customer.barangay}, {order.customer.city}
                          </p>
                          <p>
                            {order.customer.shippingCarrier} ·{" "}
                            {order.customer.region}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 border-t border-ink/8 pt-3">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateStatus(order.id, s)}
                              disabled={order.status === s}
                              className={`px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[0.16em] transition-all ${
                                order.status === s
                                  ? `${STATUS_STYLES[s]} cursor-default`
                                  : "border border-ink/15 text-ink/45 hover:border-ink hover:text-ink"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        {userId && (
                          <button
                            type="button"
                            onClick={() => setChatOrder(order)}
                            className="flex w-full items-center justify-center gap-2 border border-ink/15 py-2.5 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/65 hover:border-ink hover:text-ink"
                          >
                            <ChatIcon
                              width={12}
                              height={12}
                              strokeWidth={1.5}
                            />
                            Chat
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      )}

      {chatOrder && userId && (
        <OrderChatModal
          open={Boolean(chatOrder)}
          onClose={() => setChatOrder(null)}
          orderId={chatOrder.id}
          orderLabel={`${chatOrder.id} · ${chatOrder.customer.firstName}`}
          orderItems={chatOrder.items}
          orderTotal={chatOrder.total}
          senderId={userId}
          senderRole="admin"
        />
      )}
    </div>
  );
}
