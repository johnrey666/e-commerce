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
  "Out for Delivery": "bg-brand/15 text-brand-dark",
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
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Orders{" "}
        <span className="text-base font-medium text-muted">
          ({mounted ? orders.length : "…"})
        </span>
      </h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["All", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-brand text-white"
                : "bg-white text-muted shadow-card hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {mounted && filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white py-16 text-center shadow-card">
          <p className="font-display text-lg font-bold">No orders here</p>
          <p className="mt-1 text-sm text-muted">
            Orders placed through checkout will show up in this list.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {(mounted ? filtered : []).map((order) => {
            const expanded = expandedId === order.id;
            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-3xl bg-white shadow-card"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  aria-expanded={expanded}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-4 text-left"
                >
                  <div>
                    <p className="font-display font-bold">{order.id}</p>
                    <p className="text-sm text-muted">
                      {order.customer.firstName} {order.customer.lastName} ·{" "}
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                    <span className="font-display text-lg font-bold">
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
                      <div className="grid gap-6 border-t border-line px-6 py-5 md:grid-cols-2">
                        <div>
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                            Items
                          </h3>
                          <ul className="space-y-1.5 text-sm">
                            {order.items.map((item) => (
                              <li
                                key={`${item.productId}-${item.size ?? ""}`}
                                className="flex justify-between"
                              >
                                <span>
                                  {item.name}
                                  {item.size ? ` (${item.size})` : ""} ×{" "}
                                  {item.quantity}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2 text-sm">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Customer
                          </h3>
                          <p>{order.customer.contactNumber}</p>
                          <p>{order.customer.email}</p>
                          <p>{order.customer.address}</p>
                          {order.customer.pinnedLocation && (
                            <p className="text-muted">
                              Pinned: {order.customer.pinnedLocation}
                            </p>
                          )}
                          {order.customer.notes && (
                            <p className="text-muted">
                              Notes: {order.customer.notes}
                            </p>
                          )}
                          {order.customer.gcashReference && (
                            <p>
                              GCash ref:{" "}
                              <strong>{order.customer.gcashReference}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Set status:
                        </span>
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                              order.status === s
                                ? `${STATUS_STYLES[s]} cursor-default`
                                : "border border-line text-muted hover:border-brand hover:text-brand"
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
