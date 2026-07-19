"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type AuthResult = {
  ok: boolean;
  error?: string;
  /** True when Supabase requires email confirmation before a session exists. */
  needsEmailConfirmation?: boolean;
};

interface AuthState {
  isAdmin: boolean;
  email: string | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const MISSING_ENV =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Table missing or RLS not ready — treat authenticated user as admin
    // so first-time setup still works after Auth is connected.
    console.warn("[auth] profiles lookup failed:", error.message);
    return true;
  }

  return data?.role === "admin";
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAdmin: false,
  email: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    if (!supabaseConfigured()) {
      set({ isAdmin: false, email: null, initialized: true });
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = await isAdminUser(user.id);
        set({
          isAdmin: admin,
          email: user.email ?? null,
          initialized: true,
        });
      } else {
        set({ isAdmin: false, email: null, initialized: true });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          set({ isAdmin: false, email: null });
          return;
        }
        const admin = await isAdminUser(session.user.id);
        set({
          isAdmin: admin,
          email: session.user.email ?? null,
        });
      });
    } catch (err) {
      console.error("[auth] initialize failed:", err);
      set({ isAdmin: false, email: null, initialized: true });
    }
  },

  login: async (email, password) => {
    if (!supabaseConfigured()) {
      return { ok: false, error: MISSING_ENV };
    }

    set({ loading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user;
      if (!user) {
        return { ok: false, error: "No user returned from Supabase." };
      }

      const admin = await isAdminUser(user.id);
      if (!admin) {
        await supabase.auth.signOut();
        return { ok: false, error: "This account is not an admin." };
      }

      set({ isAdmin: true, email: user.email ?? null });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Login failed.",
      };
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password) => {
    if (!supabaseConfigured()) {
      return { ok: false, error: MISSING_ENV };
    }

    set({ loading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user;
      if (!user) {
        return { ok: false, error: "No user returned from Supabase." };
      }

      // Email confirmation enabled → no session until they click the link.
      if (!data.session) {
        return {
          ok: true,
          needsEmailConfirmation: true,
        };
      }

      // Ensure profile row exists (trigger usually handles this).
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? email.trim().toLowerCase(),
        role: "admin",
      });

      const admin = await isAdminUser(user.id);
      set({
        isAdmin: admin,
        email: user.email ?? null,
      });

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Sign up failed.",
      };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    if (supabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    set({ isAdmin: false, email: null });
  },
}));
