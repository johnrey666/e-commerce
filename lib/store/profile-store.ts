"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { CheckoutDetails, ShippingCarrier } from "@/lib/types";

export type SavedShipping = Partial<
  Pick<
    CheckoutDetails,
    | "firstName"
    | "lastName"
    | "contactNumber"
    | "email"
    | "country"
    | "region"
    | "postalCode"
    | "barangay"
    | "city"
    | "street"
    | "pinnedLocation"
    | "notes"
    | "shippingCarrier"
  >
>;

interface ProfileState {
  shipping: SavedShipping;
  darkMode: boolean;
  loaded: boolean;
  loadProfile: (userId: string) => Promise<void>;
  saveShipping: (userId: string, shipping: SavedShipping) => Promise<{ ok: boolean; error?: string }>;
  setDarkMode: (userId: string | null, enabled: boolean) => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

function applyDarkClass(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", enabled);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  shipping: {},
  darkMode: false,
  loaded: false,

  loadProfile: async (userId) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("shipping, preferences")
        .eq("id", userId)
        .maybeSingle();

      const shipping = (data?.shipping as SavedShipping) ?? {};
      const prefs = (data?.preferences as { darkMode?: boolean }) ?? {};
      const darkMode =
        typeof prefs.darkMode === "boolean"
          ? prefs.darkMode
          : localStorage.getItem("gc-dark") === "1";

      applyDarkClass(darkMode);
      set({ shipping, darkMode, loaded: true });
    } catch {
      const darkMode = localStorage.getItem("gc-dark") === "1";
      applyDarkClass(darkMode);
      set({ darkMode, loaded: true });
    }
  },

  saveShipping: async (userId, shipping) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ shipping })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };
    set({ shipping });
    return { ok: true };
  },

  setDarkMode: async (userId, enabled) => {
    applyDarkClass(enabled);
    localStorage.setItem("gc-dark", enabled ? "1" : "0");
    set({ darkMode: enabled });

    if (!userId) return;
    const supabase = createClient();
    const current = get().darkMode;
    await supabase
      .from("profiles")
      .update({ preferences: { darkMode: enabled } })
      .eq("id", userId)
      .then(() => {
        void current;
      });
  },

  changePassword: async (newPassword) => {
    if (newPassword.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
}));

export const DEFAULT_SHIPPING_CARRIER: ShippingCarrier = "JNT";
