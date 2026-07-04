"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPickerPlaceholder } from "@/components/MapPickerPlaceholder";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { selectCartTotal, useCartStore } from "@/lib/store/cart-store";
import { useOrderStore } from "@/lib/store/order-store";
import type { CheckoutDetails } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand";

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotal);
  const clearCart = useCartStore((s) => s.clear);
  const placeOrder = useOrderStore((s) => s.placeOrder);

  const [form, setForm] = useState<CheckoutDetails>({
    firstName: "",
    lastName: "",
    address: "",
    pinnedLocation: undefined,
    contactNumber: "",
    email: "",
    notes: "",
    gcashReference: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof CheckoutDetails) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    const order = placeOrder(items, total, form);
    clearCart();
    router.push(`/order-confirmation?order=${order.id}`);
  };

  if (mounted && items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add some finds before checking out.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-brand px-8 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Go to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Checkout
      </motion.h1>
      <p className="mt-1 text-sm text-muted">
        No account needed — fill in your delivery details and we&apos;ll ship your order.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-6">
          {/* Contact details */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl bg-white p-6 shadow-card"
          >
            <h2 className="mb-4 font-display text-lg font-bold">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
                  First name *
                </label>
                <input
                  id="firstName"
                  required
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => set("firstName")(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
                  Last name *
                </label>
                <input
                  id="lastName"
                  required
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => set("lastName")(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contactNumber" className="mb-1.5 block text-sm font-medium">
                  Contact number *
                </label>
                <input
                  id="contactNumber"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  value={form.contactNumber}
                  onChange={(e) => set("contactNumber")(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email *
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium">
                Address *
              </label>
              <input
                id="address"
                required
                autoComplete="street-address"
                placeholder="House no., street, barangay, city"
                value={form.address}
                onChange={(e) => set("address")(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-sm font-medium">
                Pin location{" "}
                <span className="font-normal text-muted">(optional)</span>
              </span>
              <MapPickerPlaceholder onPin={set("pinnedLocation")} />
              {form.pinnedLocation && (
                <p className="mt-1.5 text-xs font-medium text-brand">
                  Pinned: {form.pinnedLocation}
                </p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                Other details{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Notes, preferred delivery time, etc."
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                className={inputClass}
              />
            </div>
          </motion.section>

          {/* GCash placeholder */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-white p-6 shadow-card"
          >
            <h2 className="font-display text-lg font-bold">Pay via GCash</h2>
            <p className="mt-1 text-sm text-muted">
              Scan the QR with your GCash app, then enter the reference number
              below. (Placeholder — real GCash integration coming soon.)
            </p>
            <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row">
              <div
                role="img"
                aria-label="GCash QR code placeholder"
                className="grid size-40 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-line bg-cream"
              >
                <div className="text-center">
                  <div
                    className="mx-auto mb-2 size-20 rounded-lg bg-[repeating-linear-gradient(0deg,#1f2328_0_4px,transparent_4px_8px),repeating-linear-gradient(90deg,#1f2328_0_4px,transparent_4px_8px)] opacity-20"
                    aria-hidden
                  />
                  <span className="text-xs font-medium text-muted">
                    GCash QR placeholder
                  </span>
                </div>
              </div>
              <div className="w-full">
                <label htmlFor="gcashReference" className="mb-1.5 block text-sm font-medium">
                  GCash reference number{" "}
                  <span className="font-normal text-muted">(optional for now)</span>
                </label>
                <input
                  id="gcashReference"
                  placeholder="e.g. 1234 567 890123"
                  value={form.gcashReference}
                  onChange={(e) => set("gcashReference")(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-muted">
                  You can also pay in cash when you pick up your order.
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Order summary */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl bg-white p-6 shadow-card lg:sticky lg:top-24"
        >
          <h2 className="mb-4 font-display text-lg font-bold">Order summary</h2>
          <ul className="max-h-72 divide-y divide-line overflow-y-auto">
            {(mounted ? items : []).map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex items-center gap-3 py-3"
              >
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage image={item.image} alt={item.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total</span>
              <span className="font-display text-2xl font-bold">
                {formatPrice(mounted ? total : 0)}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand/40">Delivery · pay via GCash</p>
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="mt-5 w-full rounded-full bg-brand py-4 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Place order"}
          </motion.button>
          <p className="mt-3 text-center text-xs text-muted">
            By placing an order you agree to pick it up within 7 days.
          </p>
        </motion.aside>
      </form>
    </div>
  );
}
