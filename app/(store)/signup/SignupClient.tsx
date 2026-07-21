"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account/orders";

  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);
  const isCustomer = useAuthStore((s) => s.isCustomer);
  const customerSignup = useAuthStore((s) => s.customerSignup);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized && isCustomer) {
      router.replace(next);
    }
  }, [initialized, isCustomer, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const result = await customerSignup(email, password);
    if (!result.ok) {
      setError(result.error ?? "Sign up failed.");
      return;
    }
    if (result.needsEmailConfirmation) {
      setInfo(
        "Check your email to confirm your account, then sign in. (Or turn off “Confirm email” in Supabase Auth for local testing.)"
      );
      return;
    }
    router.push(next);
  };

  const onGoogle = async () => {
    setError(null);
    const result = await signInWithGoogle(next);
    if (!result.ok) setError(result.error ?? "Google sign-in failed.");
  };

  return (
    <div className="mx-auto grid max-w-md place-items-center px-5 py-16 sm:py-20">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full border border-ink/10 bg-surface p-8 sm:p-10"
      >
        <p className="eyebrow">Join Good Catch</p>
        <h1 className="mt-3 font-display text-[1.75rem] font-medium text-ink">
          Create account
        </h1>
        <p className="mt-2 text-[13px] text-ink/45">
          For browsing and placing orders.
        </p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 border border-ink/15 bg-paper py-3.5 text-[12px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          <GoogleGlyph />
          Continue with Gmail
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-ink/35">
            or email
          </span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="space-y-5">
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
              autoComplete="email"
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
              autoComplete="new-password"
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-8 w-full disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create Account"}
        </button>

        <p className="mt-6 text-center text-[12px] text-ink/45">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.1 7.1l.1.1 6.2 5.2C37.4 39 44 34 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
