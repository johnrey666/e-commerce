"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { MapPicker } from "@/components/MapPicker";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { COUNTRIES, PH_REGIONS, SHIPPING_CARRIERS } from "@/lib/locations";
import { generateOrderId } from "@/lib/orders";
import { selectCartTotal, useCartStore } from "@/lib/store/cart-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useProfileStore } from "@/lib/store/profile-store";
import type { CheckoutDetails } from "@/lib/types";

const inputClass = "input-field";
const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-ink/55";

const emptyForm: CheckoutDetails = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  email: "",
  country: "Philippines",
  region: "",
  postalCode: "",
  barangay: "",
  city: "",
  pinnedLocation: undefined,
  notes: "",
  paymentMethod: "paymongo",
  shippingCarrier: "JNT",
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const total = useCartStore(selectCartTotal);
  const clearCart = useCartStore((s) => s.clear);

  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const isCustomer = useAuthStore((s) => s.isCustomer);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const savedShipping = useProfileStore((s) => s.shipping);

  const [form, setForm] = useState<CheckoutDetails>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingHydrated, setShippingHydrated] = useState(false);
  const cancelled = searchParams.get("cancelled") === "1";

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (userId) void loadProfile(userId);
  }, [userId, loadProfile]);

  useEffect(() => {
    if (shippingHydrated || !isCustomer) return;
    const hasSaved = Object.keys(savedShipping).length > 0;
    if (!hasSaved && !email) return;

    setForm((f) => ({
      ...f,
      firstName: savedShipping.firstName || f.firstName,
      lastName: savedShipping.lastName || f.lastName,
      contactNumber: savedShipping.contactNumber || f.contactNumber,
      email: savedShipping.email || email || f.email,
      country: savedShipping.country || f.country || "Philippines",
      region: savedShipping.region || f.region,
      postalCode: savedShipping.postalCode || f.postalCode,
      barangay: savedShipping.barangay || f.barangay,
      city: savedShipping.city || f.city,
      pinnedLocation: savedShipping.pinnedLocation || f.pinnedLocation,
      notes: savedShipping.notes || f.notes,
      shippingCarrier: savedShipping.shippingCarrier || f.shippingCarrier,
    }));
    setShippingHydrated(true);
  }, [savedShipping, email, isCustomer, shippingHydrated]);

  const set = (field: keyof CheckoutDetails) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) return;
    if (!initialized) return;

    if (!isCustomer) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!form.pinnedLocation) {
      setError("Please pin your location on the map.");
      return;
    }

    setSubmitting(true);
    try {
      const orderId = generateOrderId();
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items,
          total,
          customer: form,
        }),
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start payment.");
        setSubmitting(false);
        return;
      }

      clearCart();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setSubmitting(false);
    }
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
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/50 transition-colors hover:text-ink"
        >
          <ChevronLeftIcon width={13} height={13} strokeWidth={1.5} />
          The Collection
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.25em] text-ink/50 transition-colors hover:text-ink"
        >
          Browse More
          <ChevronRightIcon width={13} height={13} strokeWidth={1.5} />
        </Link>
      </div>
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
          Delivery details, shipping, then secure payment via PayMongo.
        </p>
      </motion.div>

      {cancelled && (
        <p
          role="status"
          className="mx-auto mt-6 max-w-lg border border-ink/10 bg-surface px-4 py-3 text-center text-[13px] text-ink/60"
        >
          Payment was cancelled. You can review your details and try again.
        </p>
      )}

      {mounted && initialized && !isCustomer && (
        <div className="mx-auto mt-8 max-w-lg border border-ink/10 bg-surface p-6 text-center">
          <p className="text-[13px] leading-relaxed text-ink/60">
            Log in or create a customer account to place an order.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent("/checkout")}`}
              className="btn-primary"
            >
              Log In
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent("/checkout")}`}
              className="border border-ink/15 px-6 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/70 transition-colors hover:border-ink hover:text-ink"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_380px]"
      >
        <div className="space-y-8">
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
              <div>
                <label htmlFor="country" className={labelClass}>
                  Country *
                </label>
                <select
                  id="country"
                  required
                  value={form.country}
                  onChange={(e) => set("country")(e.target.value)}
                  className={inputClass}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region" className={labelClass}>
                  Region *
                </label>
                {form.country === "Philippines" ? (
                  <select
                    id="region"
                    required
                    value={form.region}
                    onChange={(e) => set("region")(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select region</option>
                    {PH_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="region"
                    required
                    value={form.region}
                    onChange={(e) => set("region")(e.target.value)}
                    className={inputClass}
                    placeholder="State / Province / Region"
                  />
                )}
              </div>
              <div>
                <label htmlFor="postalCode" className={labelClass}>
                  Postal code *
                </label>
                <input
                  id="postalCode"
                  required
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode")(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="barangay" className={labelClass}>
                  Barangay *
                </label>
                <input
                  id="barangay"
                  required
                  value={form.barangay}
                  onChange={(e) => set("barangay")(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="city" className={labelClass}>
                  City *
                </label>
                <input
                  id="city"
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => set("city")(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <span className={labelClass}>Pin location *</span>
              <MapPicker
                onPin={set("pinnedLocation")}
                initialPin={form.pinnedLocation}
              />
              {form.pinnedLocation && (
                <p className="mt-2 text-[11px] font-medium tracking-[0.05em] text-accent">
                  Pinned: {form.pinnedLocation}
                </p>
              )}
            </div>

            <div className="mt-5">
              <label htmlFor="notes" className={labelClass}>
                Other details{" "}
                <span className="normal-case text-ink/35">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Landmark, gate code, preferred delivery time…"
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                className={inputClass}
              />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden border border-ink/10 bg-surface p-8"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-brand/8"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-10 left-1/3 size-28 rounded-full bg-ink/[0.03]"
              aria-hidden
            />

            <h2 className="relative text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
              Select Payment Method
            </h2>
            <p className="relative mt-3 max-w-md text-[13px] leading-relaxed text-ink/50">
              You&apos;ll complete payment on PayMongo&apos;s secure checkout
              after placing your order. Your order is confirmed only when
              payment succeeds.
            </p>

            <div className="relative mt-6 border border-ink bg-cream p-5">
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="radio"
                  name="payment"
                  checked
                  readOnly
                  className="mt-1 accent-ink"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-ink">
                      PayMongo
                    </span>
                    <span className="border border-ink/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-ink/50">
                      Recommended
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[12px] leading-relaxed text-ink/50">
                    GCash, credit/debit card, Maya, GrabPay, and QR Ph — pick
                    your method on the next screen.
                  </span>
                </span>
              </label>

              <ul className="mt-5 flex flex-wrap gap-2 border-t border-ink/8 pt-4">
                {["GCash", "Card", "Maya", "GrabPay", "QR Ph"].map((method) => (
                  <li
                    key={method}
                    className="border border-ink/10 bg-paper px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/55"
                  >
                    {method}
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative mt-4 text-[11px] leading-relaxed text-ink/40">
              Encrypted checkout powered by PayMongo. We never store your full
              card or wallet credentials on Good Catch.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="border border-ink/10 bg-surface p-8"
          >
            <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.35em] text-ink">
              Shipping Option
            </h2>
            <label htmlFor="shipping" className={labelClass}>
              Carrier *
            </label>
            <select
              id="shipping"
              required
              value={form.shippingCarrier}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shippingCarrier:
                    e.target.value as CheckoutDetails["shippingCarrier"],
                }))
              }
              className={inputClass}
            >
              {SHIPPING_CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </motion.section>
        </div>

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
              {form.shippingCarrier} · PayMongo
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-[13px] font-medium text-brand">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || (mounted && initialized && !isCustomer)}
            className="btn-primary mt-7 w-full disabled:opacity-50"
          >
            {submitting
              ? "Redirecting to PayMongo…"
              : !isCustomer && initialized
                ? "Log In to Place Order"
                : "Place Order"}
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink/40">
            You&apos;ll complete payment on PayMongo. Your order is confirmed
            once payment succeeds.
          </p>
        </motion.aside>
      </form>
    </div>
  );
}
