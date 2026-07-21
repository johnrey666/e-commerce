"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { formatPrice } from "@/lib/format";
import { useCatalog, useMounted } from "@/lib/hooks";
import { fetchShopRatingSummary } from "@/lib/reviews";
import { useOrderStore } from "@/lib/store/order-store";

type RangeKey = "month" | "year" | "all";

function inRange(iso: string, range: RangeKey) {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  if (range === "month") {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }
  return d.getFullYear() === now.getFullYear();
}

export default function AdminDashboardPage() {
  const mounted = useMounted();
  const { products, ready } = useCatalog();
  const orders = useOrderStore((s) => s.orders);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const [range, setRange] = useState<RangeKey>("month");
  const [storeRating, setStoreRating] = useState<number | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const PAGE = 5;

  useEffect(() => {
    void fetchOrders("all");
  }, [fetchOrders]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const summary = await fetchShopRatingSummary();
        if (!cancelled) setStoreRating(summary.average);
      } catch {
        if (!cancelled) setStoreRating(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOrdersPage(1);
    setStockPage(1);
  }, [range]);

  const rangedOrders = useMemo(
    () => orders.filter((o) => inRange(o.createdAt, range)),
    [orders, range]
  );

  const paidOrders = rangedOrders.filter((o) => o.paymentStatus === "Paid");
  const pendingOrders = rangedOrders.filter((o) => o.status === "Pending");
  const totalSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const onSale = products.filter((p) => p.onSale);
  const lowStock = products.filter((p) => p.stock <= 1);

  const orderPages = Math.max(1, Math.ceil(rangedOrders.length / PAGE));
  const stockPages = Math.max(1, Math.ceil(lowStock.length / PAGE));
  const ordersSlice = rangedOrders.slice(
    (ordersPage - 1) * PAGE,
    ordersPage * PAGE
  );
  const stockSlice = lowStock.slice((stockPage - 1) * PAGE, stockPage * PAGE);

  const stats = [
    {
      label: "Total Products",
      value: ready ? products.length : "—",
      href: "/admin/products",
    },
    {
      label: "Total Sold",
      value: mounted ? totalSold : "—",
      href: "/admin/orders",
    },
    {
      label: "Total Revenue",
      value: mounted ? formatPrice(revenue) : "—",
      href: "/admin/orders",
    },
    {
      label: "Pending Order",
      value: mounted ? pendingOrders.length : "—",
      href: "/admin/orders",
    },
    {
      label: "On Sale",
      value: ready ? onSale.length : "—",
      href: "/admin/products",
    },
    {
      label: "Store Rating",
      value: storeRating != null ? storeRating.toFixed(1) : "—",
      href: "/reviews",
      rating: storeRating as number | null | undefined,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The Back Room</p>
          <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
            Dashboard
          </h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary !px-8 !py-3.5">
          Add Product
        </Link>
      </div>

      {storeRating != null && (
        <div className="mt-8 flex flex-wrap items-center gap-3 border border-ink/10 bg-surface px-5 py-4 sm:px-6">
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
            Shop rating
          </p>
          <StarRating value={storeRating} size={20} label="Shop rating" />
          <p className="font-display text-xl font-medium text-ink">
            {storeRating.toFixed(1)}
          </p>
          <Link
            href="/reviews"
            className="ml-auto text-[10px] font-medium uppercase tracking-[0.22em] text-ink/45 transition-colors hover:text-ink"
          >
            View all reviews
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["month", "This Month"],
            ["year", "This Year"],
            ["all", "All Time"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={`px-4 py-2 text-[9px] font-medium uppercase tracking-[0.22em] transition-colors ${
              range === key
                ? "bg-ink text-white"
                : "border border-ink/15 text-ink/50 hover:border-ink hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 border-l border-t border-ink/10 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={stat.href}
              className="group block border-b border-r border-ink/10 bg-surface p-5 transition-colors duration-300 hover:bg-brand-faint sm:p-6"
            >
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                {stat.label}
              </p>
              {"rating" in stat && stat.rating != null ? (
                <div className="mt-3 flex flex-col gap-2">
                  <StarRating
                    value={stat.rating}
                    size={18}
                    label="Store rating"
                    className="transition-colors duration-300 group-hover:[&_.text-brand]:text-brand"
                  />
                  <p className="font-display text-2xl font-medium text-ink transition-colors duration-300 group-hover:text-brand sm:text-3xl">
                    {stat.value}
                  </p>
                </div>
              ) : (
                <p className="mt-3 font-display text-2xl font-medium text-ink transition-colors duration-300 group-hover:text-brand sm:text-3xl lg:text-4xl">
                  {stat.value}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="border border-ink/10 bg-surface p-7 sm:p-8"
        >
          <p className="eyebrow">Ledger</p>
          <h2 className="mt-2 font-display text-xl font-medium text-ink">
            Recent Orders
          </h2>
          {!mounted || rangedOrders.length === 0 ? (
            <p className="mt-6 text-[13px] leading-relaxed text-ink/45">
              No orders in this period.
            </p>
          ) : (
            <>
              <ul className="mt-5 divide-y divide-ink/8">
                {ordersSlice.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between py-3.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-ink">{order.id}</p>
                      <p className="mt-0.5 text-xs text-ink/45">
                        {order.customer.firstName} {order.customer.lastName} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-ink">
                        {formatPrice(order.total)}
                      </p>
                      <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/45">
                        {order.paymentStatus} · {order.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {orderPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-4">
                  <button
                    type="button"
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => p - 1)}
                    className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] text-ink/35">
                    {ordersPage} / {orderPages}
                  </span>
                  <button
                    type="button"
                    disabled={ordersPage >= orderPages}
                    onClick={() => setOrdersPage((p) => p + 1)}
                    className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="border border-ink/10 bg-surface p-7 sm:p-8"
        >
          <p className="eyebrow">Inventory</p>
          <h2 className="mt-2 font-display text-xl font-medium text-ink">
            Low Stock Alerts
          </h2>
          {!ready || lowStock.length === 0 ? (
            <p className="mt-6 text-[13px] leading-relaxed text-ink/45">
              All stocked up.
            </p>
          ) : (
            <>
              <ul className="mt-5 divide-y divide-ink/8">
                {stockSlice.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3.5 text-sm"
                  >
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-ink transition-colors hover:text-brand"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={`px-3 py-1 text-[9px] font-medium uppercase tracking-[0.25em] ${
                        p.stock === 0
                          ? "bg-brand text-white"
                          : "bg-brand-soft text-brand"
                      }`}
                    >
                      {p.stock === 0 ? "Sold Out" : `${p.stock} Left`}
                    </span>
                  </li>
                ))}
              </ul>
              {stockPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-4">
                  <button
                    type="button"
                    disabled={stockPage <= 1}
                    onClick={() => setStockPage((p) => p - 1)}
                    className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] text-ink/35">
                    {stockPage} / {stockPages}
                  </span>
                  <button
                    type="button"
                    disabled={stockPage >= stockPages}
                    onClick={() => setStockPage((p) => p + 1)}
                    className="text-[10px] uppercase tracking-[0.2em] text-ink/45 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.section>
      </div>
    </div>
  );
}
