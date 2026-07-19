"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useOrderStore } from "@/lib/store/order-store";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["Pending", "Out for Delivery", "Delivered"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-brand-soft text-brand",
  "Out for Delivery": "bg-ink/8 text-ink",
  Delivered: "bg-brand text-white",
};

export default function AdminOrdersPage() {
  const mounted = useMounted();
  const orders = useOrderStore((s) => s.orders);
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    statusFilter === "All"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div>
      <p className="eyebrow">The Ledger</p>
      <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        Orders
        <span className="ml-3 align-middle text-base font-normal text-ink/40">
          {mounted ? orders.length : "…"}
        </span>
      </h1>

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

      {mounted && filtered.length === 0 ? (
        <div className="mt-10 border border-ink/10 bg-surface px-6 py-20 text-center">
          <p className="eyebrow">Quiet For Now</p>
          <p className="mt-4 font-display text-2xl font-medium text-ink">
            No orders here
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-ink/45">
            Orders placed through checkout will show up in this list.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
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
                  <div className="flex items-center gap-4">
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
                          <ul className="space-y-2 text-sm">
                            {order.items.map((item) => (
                              <li
                                key={`${item.productId}-${item.size ?? ""}`}
                                className="flex justify-between"
                              >
                                <span className="text-ink/70">
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
                        </div>
                        <div className="space-y-2 text-sm text-ink/70">
                          <h3 className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                            Customer
                          </h3>
                          <p>{order.customer.contactNumber}</p>
                          <p>{order.customer.email}</p>
                          <p>{order.customer.address}</p>
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
                          {order.customer.gcashReference && (
                            <p>
                              GCash ref:{" "}
                              <strong className="text-ink">
                                {order.customer.gcashReference}
                              </strong>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
