"use client";

import { FormEvent, useState } from "react";

export default function AdminTeamPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create admin.");
        return;
      }
      setSuccess(`Admin account created for ${data.email}.`);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="eyebrow">Access</p>
      <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.6rem]">
        Create admin
      </h1>
      <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ink/50">
        Add another admin account. They sign in from the storefront Sign In
        page and are routed to this dashboard.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 max-w-md border border-ink/10 bg-surface p-8"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-ink/55"
            >
              Temporary password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              minLength={6}
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
        {success && (
          <p role="status" className="mt-5 text-[13px] text-ink/60">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-8 w-full disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create Admin Account"}
        </button>
      </form>
    </div>
  );
}
