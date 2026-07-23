"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/icons";
import { COUNTRIES, PH_REGIONS, SHIPPING_CARRIERS } from "@/lib/locations";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  DEFAULT_SHIPPING_CARRIER,
  useProfileStore,
  type SavedShipping,
} from "@/lib/store/profile-store";
import { useToastStore } from "@/lib/store/toast-store";

const labelClass =
  "mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-ink/55";

const menuBtnClass =
  "flex w-full items-center justify-between border border-ink/15 px-4 py-3.5 text-left text-[10px] font-medium uppercase tracking-[0.24em] text-ink/60 transition-colors hover:border-ink hover:text-ink";

type Panel = "menu" | "shipping" | "password";

export function ProfileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useToastStore((s) => s.show);

  const shipping = useProfileStore((s) => s.shipping);
  const darkMode = useProfileStore((s) => s.darkMode);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const saveShipping = useProfileStore((s) => s.saveShipping);
  const setDarkMode = useProfileStore((s) => s.setDarkMode);
  const changePassword = useProfileStore((s) => s.changePassword);

  const [panel, setPanel] = useState<Panel>("menu");
  const [form, setForm] = useState<SavedShipping>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userId) void loadProfile(userId);
  }, [open, userId, loadProfile]);

  useEffect(() => {
    if (!open) return;
    setPanel("menu");
    setErr(null);
    setPassword("");
    setConfirm("");
  }, [open]);

  useEffect(() => {
    if (open) setForm({ ...shipping });
  }, [open, shipping]);

  const set =
    (key: keyof SavedShipping) =>
    (value: string) =>
      setForm((f) => ({ ...f, [key]: value }));

  const goMenu = () => {
    setPanel("menu");
    setErr(null);
  };

  const onSaveShipping = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setErr(null);
    const result = await saveShipping(userId, {
      ...form,
      shippingCarrier: form.shippingCarrier ?? DEFAULT_SHIPPING_CARRIER,
      country: form.country || "Philippines",
    });
    setSaving(false);
    if (!result.ok) {
      setErr(result.error ?? "Could not save shipping.");
      return;
    }
    setPanel("menu");
    onClose();
    showToast("Shipping address saved");
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    const result = await changePassword(password);
    if (!result.ok) {
      setErr(result.error ?? "Could not update password.");
      return;
    }
    setPassword("");
    setConfirm("");
    setPanel("menu");
    onClose();
    showToast("Password changed successfully");
  };

  const title =
    panel === "shipping"
      ? "Shipping"
      : panel === "password"
        ? "Password"
        : "Profile";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close profile"
            className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Profile settings"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-y-0 right-0 z-[75] flex w-full max-w-md flex-col border-l border-ink/10 bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="min-w-0 flex-1">
                {panel !== "menu" ? (
                  <button
                    type="button"
                    onClick={goMenu}
                    className="mb-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45 transition-colors hover:text-ink"
                  >
                    <ChevronLeftIcon width={14} height={14} strokeWidth={1.5} />
                    Back
                  </button>
                ) : (
                  <p className="eyebrow">Account</p>
                )}
                <h2 className="mt-1 font-display text-2xl font-medium text-ink">
                  {title}
                </h2>
                {panel === "menu" && (
                  <p className="mt-1 truncate text-[12px] text-ink/45">{email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-10 shrink-0 place-items-center border border-ink/15 text-ink/60 hover:border-ink hover:text-ink"
              >
                <CloseIcon width={18} height={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              {err && (
                <p className="text-[13px] font-medium text-brand">{err}</p>
              )}

              {panel === "menu" && (
                <>
                  <section>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-[11px] font-medium uppercase tracking-[0.3em] text-ink">
                          Appearance
                        </h3>
                        <p className="mt-1 text-[12px] text-ink/45">Dark mode</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={darkMode}
                        onClick={() => void setDarkMode(userId, !darkMode)}
                        className={`relative h-8 w-14 border transition-colors ${
                          darkMode
                            ? "border-ink bg-ink"
                            : "border-ink/20 bg-cream"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 size-6 bg-paper transition-all ${
                            darkMode ? "left-7" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </section>

                  <section className="space-y-3">
                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setErr(null);
                          setPanel("shipping");
                        }}
                        className={menuBtnClass}
                      >
                        Shipping Details
                        <ChevronRightIcon
                          width={16}
                          height={16}
                          strokeWidth={1.5}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setErr(null);
                        setPanel("password");
                      }}
                      className={menuBtnClass}
                    >
                      Change Password
                      <ChevronRightIcon
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                      />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push("/admin");
                        }}
                        className={menuBtnClass}
                      >
                        Open Admin Dashboard
                        <ChevronRightIcon
                          width={16}
                          height={16}
                          strokeWidth={1.5}
                        />
                      </button>
                    )}
                  </section>
                </>
              )}

              {panel === "shipping" && !isAdmin && (
                <form onSubmit={onSaveShipping} className="space-y-4">
                  <p className="text-[12px] leading-relaxed text-ink/45">
                    Saved details auto-fill checkout when you place an order.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>First name</label>
                      <input
                        className="input-field"
                        value={form.firstName ?? ""}
                        onChange={(e) => set("firstName")(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Last name</label>
                      <input
                        className="input-field"
                        value={form.lastName ?? ""}
                        onChange={(e) => set("lastName")(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contact</label>
                      <input
                        className="input-field"
                        value={form.contactNumber ?? ""}
                        onChange={(e) => set("contactNumber")(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={form.email ?? email ?? ""}
                        onChange={(e) => set("email")(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <select
                        className="input-field"
                        value={form.country ?? "Philippines"}
                        onChange={(e) => set("country")(e.target.value)}
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Region</label>
                      {(form.country ?? "Philippines") === "Philippines" ? (
                        <select
                          className="input-field"
                          value={form.region ?? ""}
                          onChange={(e) => set("region")(e.target.value)}
                        >
                          <option value="">Select</option>
                          {PH_REGIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input-field"
                          value={form.region ?? ""}
                          onChange={(e) => set("region")(e.target.value)}
                        />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Postal code</label>
                      <input
                        className="input-field"
                        value={form.postalCode ?? ""}
                        onChange={(e) => set("postalCode")(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Barangay</label>
                      <input
                        className="input-field"
                        value={form.barangay ?? ""}
                        onChange={(e) => set("barangay")(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>City</label>
                      <input
                        className="input-field"
                        value={form.city ?? ""}
                        onChange={(e) => set("city")(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Street</label>
                      <input
                        className="input-field"
                        placeholder="Street, building, unit…"
                        value={form.street ?? ""}
                        onChange={(e) => set("street")(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Carrier</label>
                      <select
                        className="input-field"
                        value={form.shippingCarrier ?? DEFAULT_SHIPPING_CARRIER}
                        onChange={(e) => set("shippingCarrier")(e.target.value)}
                      >
                        {SHIPPING_CARRIERS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Shipping"}
                  </button>
                </form>
              )}

              {panel === "password" && (
                <form onSubmit={onChangePassword} className="space-y-4">
                  <div>
                    <label className={labelClass}>New password</label>
                    <input
                      type="password"
                      minLength={6}
                      className="input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm password</label>
                    <input
                      type="password"
                      minLength={6}
                      className="input-field"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-secondary w-full !px-6">
                    Update Password
                  </button>
                </form>
              )}
            </div>

            {panel === "menu" && (
              <div className="border-t border-ink/10 p-6">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onClose();
                    showToast("Logged out successfully");
                    router.push("/");
                  }}
                  className="w-full border border-brand/30 py-3.5 text-[10px] font-medium uppercase tracking-[0.24em] text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  Log Out
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
