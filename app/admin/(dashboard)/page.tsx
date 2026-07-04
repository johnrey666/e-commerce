"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCatalog, useMounted } from "@/lib/hooks";
import { useOrderStore } from "@/lib/store/order-store";

export default function AdminDashboardPage() {
  const mounted = useMounted();
  const { products, brands, ready } = useCatalog();
  const orders = useOrderStore((s) => s.orders);

  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const lowStock = products.filter((p) => p.stock <= 1);
  const onSale = products.filter((p) => p.onSale);
  const revenue = orders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Total products", value: ready ? products.length : "—", href: "/admin/products" },
    { label: "Total orders", value: mounted ? orders.length : "—", href: "/admin/orders" },
    { label: "Pending orders", value: mounted ? pendingOrders.length : "—", href: "/admin/orders" },
    { label: "Low stock (≤1)", value: ready ? lowStock.length : "—", href: "/admin/products" },
    { label: "On sale", value: ready ? onSale.length : "—", href: "/admin/products" },
    { label: "Brands", value: ready ? brands.length : "—", href: "/admin/brands" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          + Add product
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={stat.href}
              className="block rounded-2xl bg-white p-5 shadow-card transition-shadow hover:shadow-lift"
            >
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">
                {stat.value}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl bg-white p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-bold">Recent orders</h2>
          {!mounted || orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No orders yet — they&apos;ll appear here when customers check out.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-xs text-muted">
                      {order.customer.firstName} {order.customer.lastName} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <p className="text-xs text-muted">{order.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Completed revenue: {formatPrice(mounted ? revenue : 0)}
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl bg-white p-6 shadow-card"
        >
          <h2 className="font-display text-lg font-bold">Low stock alerts</h2>
          {!ready || lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted">All stocked up.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="font-medium hover:text-brand"
                  >
                    {p.name}
                  </Link>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.stock === 0
                        ? "bg-brand text-white"
                        : "bg-brand-light text-brand"
                    }`}
                  >
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
