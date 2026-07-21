"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OrderChatModal } from "@/components/OrderChatModal";
import { StarRating } from "@/components/StarRating";
import { ChatIcon } from "@/components/icons";
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
            className={`px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.24em] transition-all duration-300 ${
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
        <ul className="mt-8 space-y-4">
          {(mounted ? filtered : []).map((order) => {
            const expanded = expandedId === order.id;
            return (
              <li
                key={order.id}
                className="overflow-hidden border border-ink/10 bg-surface"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  aria-expanded={expanded}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-brand-faint sm:px-7"
                >
                  <div>
                    <p className="font-display text-lg font-medium text-ink">
                      {order.id}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink/45">
                      {order.customer.firstName} {order.customer.lastName} ·{" "}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.25em] ${PAYMENT_STYLES[order.paymentStatus]}`}
                    >
                      {order.paymentStatus}
                    </span>
                    <span
                      className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.25em] ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                    <span className="font-display text-xl font-medium text-ink">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 border-t border-ink/10 px-6 py-6 sm:px-7 md:grid-cols-2">
                        <div>
                          <h3 className="mb-3 text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                            Items
                          </h3>
                          <ul className="space-y-4 text-sm">
                            {order.items.map((item) => {
                              const review = reviewFor(
                                order.id,
                                item.productId
                              );
                              return (
                                <li
                                  key={`${item.productId}-${item.size ?? ""}`}
                                >
                                  <div className="flex justify-between gap-3">
                                    <span className="text-ink/70">
                                      {item.name}
                                      {item.size ? ` (${item.size})` : ""} ×{" "}
                                      {item.quantity}
                                    </span>
                                    <span className="font-medium text-ink">
                                      {formatPrice(
                                        item.unitPrice * item.quantity
                                      )}
                                    </span>
                                  </div>
                                  {review ? (
                                    <div className="mt-2 border-l-2 border-brand/30 pl-3">
                                      <StarRating
                                        value={review.rating}
                                        size={12}
                                      />
                                      {review.body ? (
                                        <p className="mt-1 text-[12px] leading-relaxed text-ink/55">
                                          {review.body}
                                        </p>
                                      ) : null}
                                      <p className="mt-1 text-[10px] text-ink/35">
                                        {review.reviewerName}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-[11px] text-ink/30">
                                      No review yet
                                    </p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="space-y-2 text-sm text-ink/70">
                          <h3 className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                            Customer
                          </h3>
                          <p>{order.customer.contactNumber}</p>
                          <p>{order.customer.email}</p>
                          <p>
                            {order.customer.barangay}, {order.customer.city}
                          </p>
                          <p>
                            {order.customer.region} {order.customer.postalCode}
                          </p>
                          <p>{order.customer.country}</p>
                          <p>Ship via {order.customer.shippingCarrier}</p>
                          {order.customer.pinnedLocation && (
                            <p className="text-ink/45">
                              Pinned: {order.customer.pinnedLocation}
                            </p>
                          )}
                          {order.customer.notes && (
                            <p className="text-ink/45">
                              Notes: {order.customer.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 border-t border-ink/10 px-6 py-5 sm:px-7">
                        <span className="mr-2 text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                          Set Status
                        </span>
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s}
                            className={`px-4 py-2 text-[9px] font-medium uppercase tracking-[0.22em] transition-all duration-300 ${
                              order.status === s
                                ? `${STATUS_STYLES[s]} cursor-default`
                                : "border border-ink/15 text-ink/50 hover:border-ink hover:text-ink"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                        {userId && (
                          <button
                            type="button"
                            onClick={() => setChatOrder(order)}
                            className="ml-auto inline-flex items-center gap-2 border border-ink/15 px-4 py-2 text-[9px] font-medium uppercase tracking-[0.22em] text-ink/60 hover:border-ink hover:text-ink"
                          >
                            <ChatIcon
                              width={13}
                              height={13}
                              strokeWidth={1.5}
                            />
                            Chat
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
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
          senderId={userId}
          senderRole="admin"
        />
      )}
    </div>
  );
}
