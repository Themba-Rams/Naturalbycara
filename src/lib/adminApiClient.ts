"use client";

// Thin client-side fetch wrapper for the /api/admin/* endpoints used by the
// admin dashboard pages. Centralizes the "session expired mid-session"
// handling: any 401 response redirects the browser to /admin/login.
// This is a UI-layer helper only — it does not implement or verify auth
// itself (see src/lib/adminSession.ts, which is off-limits).

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      // A full navigation (rather than router.push) is intentional here:
      // this helper is called from plain data-fetching code, not from a
      // component render/event-handler with access to useRouter, and a
      // hard redirect also guarantees any stale client state is discarded
      // once the session has actually expired.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin/login");
    }
    throw new AdminApiError("unauthorized", 401);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ?? "Something went wrong.";
    throw new AdminApiError(message, res.status);
  }

  return data as T;
}
