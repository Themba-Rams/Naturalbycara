"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="rounded-full border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-accent hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}
