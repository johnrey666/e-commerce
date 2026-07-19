"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/lib/store/auth-store";

type Mode = "login" | "signup";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const initialize = useAuthStore((s) => s.initialize);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && isAdmin) {
      router.replace("/admin");
    }
  }, [initialized, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const result =
      mode === "login"
        ? await login(email, password)
        : await signup(email, password);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    if (result.needsEmailConfirmation) {
      setInfo(
        "Check your email to confirm your account, then sign in. (Or turn off “Confirm email” in Supabase Auth settings for local testing.)"
      );
      setMode("login");
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-12 flex justify-center">
          <Logo size="xl" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="border border-ink/10 bg-surface p-8 sm:p-10"
        >
          <p className="eyebrow">The Back Room</p>
          <h1 className="mt-3 font-display text-[1.75rem] font-medium leading-tight text-ink">
            {mode === "login" ? "Admin Login" : "Create Admin Account"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink/45">
            {mode === "login"
              ? "Sign in with your Supabase admin account."
              : "Register a new admin for the Good Catch dashboard."}
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-5 text-sm font-medium text-brand">
              {error}
            </p>
          )}

          {info && (
            <p role="status" className="mt-5 text-[13px] leading-relaxed text-ink/55">
              {info}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="btn-primary mt-8 w-full disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? "Signing In…"
                : "Creating Account…"
              : mode === "login"
                ? "Sign In"
                : "Sign Up"}
          </motion.button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="mt-6 w-full text-center text-[10px] font-medium uppercase tracking-[0.24em] text-ink/45 transition-colors duration-300 hover:text-ink"
          >
            {mode === "login"
              ? "Need an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
