"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

export type AuthResult = {
  ok: boolean;
  error?: string;
  role?: UserRole;
  /** True when Supabase requires email confirmation before a session exists. */
  needsEmailConfirmation?: boolean;
};

interface AuthState {
  isAdmin: boolean;
  isCustomer: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  /** Unified email/password sign-in (customer → store, admin → dashboard). */
  signIn: (email: string, password: string) => Promise<AuthResult>;
  /** @deprecated Use signIn — kept for older admin login redirects. */
  login: (email: string, password: string) => Promise<AuthResult>;
  /** Create another admin (from dashboard). Prefer /api/admin/create-admin. */
  signup: (email: string, password: string) => Promise<AuthResult>;
  /** @deprecated Use signIn */
  customerLogin: (email: string, password: string) => Promise<AuthResult>;
  /** Customer email/password signup. */
  customerSignup: (email: string, password: string) => Promise<AuthResult>;
  /** Google OAuth for customers. */
  signInWithGoogle: (redirectTo?: string) => Promise<AuthResult>;
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

async function fetchProfileRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[auth] profiles lookup failed:", error.message);
    return null;
  }

  if (data?.role === "admin" || data?.role === "user") {
    return data.role;
  }
  return null;
}

function applySession(
  set: (partial: Partial<AuthState>) => void,
  userId: string | null,
  email: string | null,
  role: UserRole | null
) {
  set({
    userId,
    email,
    role,
    isAdmin: role === "admin",
    isCustomer: role === "user",
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAdmin: false,
  isCustomer: false,
  userId: null,
  email: null,
  role: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    if (!supabaseConfigured()) {
      applySession(set, null, null, null);
      set({ initialized: true });
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = await fetchProfileRole(user.id);
        applySession(set, user.id, user.email ?? null, role);
      } else {
        applySession(set, null, null, null);
      }
      set({ initialized: true });

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          applySession(set, null, null, null);
          return;
        }
        const role = await fetchProfileRole(session.user.id);
        applySession(
          set,
          session.user.id,
          session.user.email ?? null,
          role
        );
      });
    } catch (err) {
      console.error("[auth] initialize failed:", err);
      applySession(set, null, null, null);
      set({ initialized: true });
    }
  },

  signIn: async (email, password) => {
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

      let role = await fetchProfileRole(user.id);
      if (!role) {
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email ?? email.trim().toLowerCase(),
          role: "user",
        });
        role = "user";
      }

      applySession(set, user.id, user.email ?? null, role);
      return { ok: true, role };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Login failed.",
      };
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const result = await get().signIn(email, password);
    if (!result.ok) return result;
    if (result.role !== "admin") {
      await get().logout();
      return { ok: false, error: "This account is not an admin." };
    }
    return result;
  },

  signup: async (email, password) => {
    if (!supabaseConfigured()) {
      return { ok: false, error: MISSING_ENV };
    }

    set({ loading: true });
    try {
      const supabase = createClient();
      const normalized = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { role: "admin" } },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user;
      if (!user) {
        return { ok: false, error: "No user returned from Supabase." };
      }

      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true };
      }

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? normalized,
        role: "admin",
      });

      applySession(set, user.id, user.email ?? null, "admin");
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

  customerLogin: async (email, password) => get().signIn(email, password),

  customerSignup: async (email, password) => {
    if (!supabaseConfigured()) {
      return { ok: false, error: MISSING_ENV };
    }

    set({ loading: true });
    try {
      const supabase = createClient();
      const normalized = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { role: "user" } },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      const user = data.user;
      if (!user) {
        return { ok: false, error: "No user returned from Supabase." };
      }

      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true };
      }

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? normalized,
        role: "user",
      });

      applySession(set, user.id, user.email ?? null, "user");
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

  signInWithGoogle: async (redirectTo) => {
    if (!supabaseConfigured()) {
      return { ok: false, error: MISSING_ENV };
    }

    set({ loading: true });
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const next = redirectTo ?? "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Google sign-in failed.",
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
    applySession(set, null, null, null);
  },
}));
