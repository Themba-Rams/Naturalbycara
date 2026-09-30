"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="glass-card w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/logo.jpg"
            alt="Natural By Cara logo"
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border border-border-subtle object-cover"
          />
          <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">
            Natural By Cara
          </h1>
          <p className="mt-1 text-sm text-text-muted">Admin login</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Password
            <span className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-card-solid px-4 py-3 pr-11 text-base text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30"
                autoComplete="current-password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 flex h-6 w-6 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 5.09A9.77 9.77 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-3.17 3.88M6.1 6.1C3.6 7.77 2 12 2 12a13.15 13.15 0 0 0 4.22 4.9A9.77 9.77 0 0 0 12 19" />
                  </svg>
                )}
              </button>
            </span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-accent-contrast-text shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
