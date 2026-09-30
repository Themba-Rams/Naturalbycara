"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";
import { formatDateForDisplay, formatTimeForDisplay } from "@/lib/formatting";

interface Booking {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled";
  service: { id: string; name: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function load() {
    const query = showAll ? "?includePast=true" : "";
    adminFetch<{ bookings: Booking[] }>(`/api/admin/bookings${query}`)
      .then((data) => {
        setBookings(data.bookings);
        setError(null);
      })
      .catch(() => setError("Couldn't load bookings. Please try again."));
  }

  useEffect(load, [showAll]);

  async function handleCancel(booking: Booking) {
    if (
      !window.confirm(
        `Cancel ${booking.client_name}'s ${booking.service.name} booking on ${formatDateForDisplay(
          booking.booking_date
        )} at ${formatTimeForDisplay(booking.start_time)}?`
      )
    ) {
      return;
    }
    setCancellingId(booking.id);
    try {
      await adminFetch(`/api/admin/bookings/${booking.id}/cancel`, { method: "POST" });
      setBookings((prev) =>
        prev
          ? prev.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b))
          : prev
      );
    } catch {
      setError("Couldn't cancel that booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-text-primary">Bookings</h2>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 rounded border-border-default text-accent accent-accent"
          />
          Include past &amp; cancelled
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {bookings === null && !error && <p className="text-sm text-text-muted">Loading…</p>}
      {bookings !== null && bookings.length === 0 && (
        <p className="text-sm text-text-muted">No bookings to show.</p>
      )}

      {bookings !== null && bookings.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card-solid shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-bg-surface-alt text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr
                  key={booking.id}
                  className={`border-t border-border-subtle ${
                    index % 2 === 1 ? "bg-bg-surface-alt/40" : ""
                  } ${booking.status === "cancelled" ? "text-text-muted" : "text-text-primary"}`}
                >
                  <td
                    className={`px-4 py-3 ${
                      booking.status === "cancelled" ? "line-through" : ""
                    }`}
                  >
                    {booking.client_name}
                  </td>
                  <td className="px-4 py-3">{booking.client_phone}</td>
                  <td className="px-4 py-3">{booking.service.name}</td>
                  <td className="px-4 py-3">{formatDateForDisplay(booking.booking_date)}</td>
                  <td className="px-4 py-3">{formatTimeForDisplay(booking.start_time)}</td>
                  <td className="px-4 py-3 capitalize">{booking.status}</td>
                  <td className="px-4 py-3">
                    {booking.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(booking)}
                        disabled={cancellingId === booking.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                      >
                        {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
