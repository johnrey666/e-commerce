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

const inputClass = "input-field";
const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-ink/55";

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
      <div className="mx-auto max-w-2xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Your bag is empty
        </h1>
        <p className="mt-3 text-[13px] text-ink/50">
          Add a piece or two before checking out.
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          Explore the Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="rule-diamond mx-auto max-w-sm">
          <p className="eyebrow">Almost Yours</p>
        </div>
        <h1 className="section-title mt-5">Checkout</h1>
        <p className="mt-3 text-[13px] text-ink/45">
          No account needed — fill in your delivery details and we&apos;ll
          take care of the rest.
        </p>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-8">
          {/* Contact details */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-ink/10 bg-surface p-8"
          >
            <h2 className="mb-7 text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
              Delivery Details
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>
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
                <label htmlFor="lastName" className={labelClass}>
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
                <label htmlFor="contactNumber" className={labelClass}>
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
                <label htmlFor="email" className={labelClass}>
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

            <div className="mt-5">
              <label htmlFor="address" className={labelClass}>
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

            <div className="mt-5">
              <span className={labelClass}>
                Pin location <span className="normal-case text-ink/35">(optional)</span>
              </span>
              <MapPickerPlaceholder onPin={set("pinnedLocation")} />
              {form.pinnedLocation && (
                <p className="mt-2 text-[11px] font-medium tracking-[0.05em] text-accent">
                  Pinned: {form.pinnedLocation}
                </p>
              )}
            </div>

            <div className="mt-5">
              <label htmlFor="notes" className={labelClass}>
                Other details <span className="normal-case text-ink/35">(optional)</span>
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
            className="border border-ink/10 bg-surface p-8"
          >
            <h2 className="text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
              Payment via GCash
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-ink/50">
              Scan the QR with your GCash app, then enter the reference number
              below. (Placeholder — real GCash integration coming soon.)
            </p>
            <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row">
              <div
                role="img"
                aria-label="GCash QR code placeholder"
                className="grid size-40 shrink-0 place-items-center border border-dashed border-ink/20 bg-cream"
              >
                <div className="text-center">
                  <div
                    className="mx-auto mb-2 size-20 bg-[repeating-linear-gradient(0deg,#1c1b1a_0_4px,transparent_4px_8px),repeating-linear-gradient(90deg,#1c1b1a_0_4px,transparent_4px_8px)] opacity-15"
                    aria-hidden
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                    GCash QR
                  </span>
                </div>
              </div>
              <div className="w-full">
                <label htmlFor="gcashReference" className={labelClass}>
                  GCash reference{" "}
                  <span className="normal-case text-ink/35">(optional for now)</span>
                </label>
                <input
                  id="gcashReference"
                  placeholder="e.g. 1234 567 890123"
                  value={form.gcashReference}
                  onChange={(e) => set("gcashReference")(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
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
          className="border border-ink/10 bg-surface p-8 lg:sticky lg:top-32"
        >
          <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
            Order Summary
          </h2>
          <ul className="max-h-72 divide-y divide-ink/8 overflow-y-auto">
            {(mounted ? items : []).map((item) => (
              <li
                key={`${item.productId}-${item.size ?? ""}`}
                className="flex items-center gap-4 py-4"
              >
                <div className="h-16 w-[52px] shrink-0 overflow-hidden bg-brand-soft">
                  <ProductImage image={item.image} alt={item.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-ink/40">
                    {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
                  </p>
                </div>
                <span className="text-[13px] font-medium text-ink">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-ink/10 pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/45">
                Total
              </span>
              <span className="font-display text-3xl font-medium text-ink">
                {formatPrice(mounted ? total : 0)}
              </span>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-ink/35">
              Complimentary delivery · GCash
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-7 w-full disabled:opacity-50"
          >
            {submitting ? "Placing Order…" : "Place Order"}
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink/40">
            By placing an order you agree to pick it up within 7 days.
          </p>
        </motion.aside>
      </form>
    </div>
  );
}
