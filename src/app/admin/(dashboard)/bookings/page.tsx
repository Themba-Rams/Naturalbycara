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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Bookings</h2>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Include past &amp; cancelled
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {bookings === null && !error && <p className="text-sm text-zinc-500">Loading…</p>}
      {bookings !== null && bookings.length === 0 && (
        <p className="text-sm text-zinc-500">No bookings to show.</p>
      )}

      {bookings !== null && bookings.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className={`border-t border-zinc-100 ${
                    booking.status === "cancelled" ? "text-zinc-400" : "text-zinc-900"
                  }`}
                >
                  <td
                    className={`px-4 py-2 ${
                      booking.status === "cancelled" ? "line-through" : ""
                    }`}
                  >
                    {booking.client_name}
                  </td>
                  <td className="px-4 py-2">{booking.client_phone}</td>
                  <td className="px-4 py-2">{booking.service.name}</td>
                  <td className="px-4 py-2">{formatDateForDisplay(booking.booking_date)}</td>
                  <td className="px-4 py-2">{formatTimeForDisplay(booking.start_time)}</td>
                  <td className="px-4 py-2 capitalize">{booking.status}</td>
                  <td className="px-4 py-2">
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
