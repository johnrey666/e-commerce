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
    { label: "Total Products", value: ready ? products.length : "—", href: "/admin/products" },
    { label: "Total Orders", value: mounted ? orders.length : "—", href: "/admin/orders" },
    { label: "Pending Orders", value: mounted ? pendingOrders.length : "—", href: "/admin/orders" },
    { label: "Low Stock", value: ready ? lowStock.length : "—", href: "/admin/products" },
    { label: "On Sale", value: ready ? onSale.length : "—", href: "/admin/products" },
    { label: "Brands", value: ready ? brands.length : "—", href: "/admin/brands" },
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

      <div className="mt-10 grid grid-cols-2 border-l border-t border-ink/10 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={stat.href}
              className="group block border-b border-r border-ink/10 bg-surface p-6 transition-colors duration-300 hover:bg-brand-faint"
            >
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/45">
                {stat.label}
              </p>
              <p className="mt-3 font-display text-4xl font-medium text-ink transition-colors duration-300 group-hover:text-brand">
                {stat.value}
              </p>
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
          {!mounted || orders.length === 0 ? (
            <p className="mt-6 text-[13px] leading-relaxed text-ink/45">
              No orders yet — they&apos;ll appear here when customers check out.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-ink/8">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-ink">{order.id}</p>
                    <p className="mt-0.5 text-xs text-ink/45">
                      {order.customer.firstName} {order.customer.lastName} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink">{formatPrice(order.total)}</p>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/45">
                      {order.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 border-t border-ink/8 pt-4 text-[10px] font-medium uppercase tracking-[0.25em] text-ink/45">
            Completed revenue · {formatPrice(mounted ? revenue : 0)}
          </p>
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
            <ul className="mt-5 divide-y divide-ink/8">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3.5 text-sm">
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
          )}
        </motion.section>
      </div>
    </div>
  );
}
