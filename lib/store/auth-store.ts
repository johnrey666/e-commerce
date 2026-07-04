"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Placeholder admin auth. Replace with NextAuth / Firebase Auth later:
 * keep the same `isAdmin` / `login` / `logout` surface and swap internals.
 */

const PLACEHOLDER_ADMIN = {
  email: "admin@goodcatch.shop",
  password: "goodcatch123",
};

interface AuthState {
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: (email, password) => {
        const ok =
          email.trim().toLowerCase() === PLACEHOLDER_ADMIN.email &&
          password === PLACEHOLDER_ADMIN.password;
        if (ok) set({ isAdmin: true });
        return ok;
      },
      logout: () => set({ isAdmin: false }),
    }),
    { name: "good-catch-auth" }
  )
);
