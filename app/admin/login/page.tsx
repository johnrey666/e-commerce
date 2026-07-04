"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      router.push("/admin");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 flex justify-center">
          <Logo size="xl" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line/70 bg-surface p-8 shadow-card"
        >
          <h1 className="font-display text-2xl font-bold">Admin login</h1>
          <p className="mt-1 text-sm text-muted">
            Placeholder auth — swap in NextAuth/Firebase later.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-brand">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-full bg-brand py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Sign in
          </motion.button>

          <p className="mt-5 rounded-xl bg-cream p-3 text-xs text-muted">
            Demo credentials: <strong>admin@goodcatch.shop</strong> /{" "}
            <strong>goodcatch123</strong>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
