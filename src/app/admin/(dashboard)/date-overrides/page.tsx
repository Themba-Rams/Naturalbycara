"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";
import { formatDateForDisplay, todayLocalDateString } from "@/lib/formatting";

interface Override {
  id: string;
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

export default function AdminDateOverridesPage() {
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [isClosed, setIsClosed] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    adminFetch<{ overrides: Override[] }>("/api/admin/date-overrides")
      .then((data) => setOverrides(data.overrides))
      .catch(() => setError("Couldn't load date overrides."));
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      setFormError("Please choose a date.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await adminFetch("/api/admin/date-overrides", {
        method: "POST",
        body: JSON.stringify({
          date,
          isClosed,
          startTime: isClosed ? null : startTime,
          endTime: isClosed ? null : endTime,
          note: note.trim() || null,
        }),
      });
      setDate("");
      setNote("");
      load();
    } catch {
      setFormError(
        "Couldn't add that override — if this date already has one, delete it below first."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this date override?")) return;
    try {
      await adminFetch(`/api/admin/date-overrides/${id}`, { method: "DELETE" });
      setOverrides((prev) => (prev ? prev.filter((o) => o.id !== id) : prev));
    } catch {
      setError("Couldn't delete that override. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">Date Overrides</h2>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card-solid p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Date
          <input
            type="date"
            value={date}
            min={todayLocalDateString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border-default bg-surface-card-solid px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.target.checked)}
            className="h-4 w-4 rounded border-border-default text-accent accent-accent"
          />
          Closed all day
        </label>
        {!isClosed && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-lg border border-border-default bg-surface-card-solid px-2 py-1.5 text-sm text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30"
            />
            <span className="text-sm text-text-muted">to</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-lg border border-border-default bg-surface-card-solid px-2 py-1.5 text-sm text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Note (optional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-border-default bg-surface-card-solid px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="e.g. Public holiday"
          />
        </label>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-full bg-accent px-6 py-2 text-sm font-semibold text-accent-contrast-text shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add override"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {overrides === null && !error && <p className="text-sm text-text-muted">Loading…</p>}
      {overrides !== null && overrides.length === 0 && (
        <p className="text-sm text-text-muted">No date overrides yet.</p>
      )}
      {overrides !== null && overrides.length > 0 && (
        <ul className="flex flex-col gap-2">
          {overrides.map((override) => (
            <li
              key={override.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-card-solid px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium text-text-primary">
                  {formatDateForDisplay(override.date)}
                </p>
                <p className="text-sm text-text-muted">
                  {override.is_closed
                    ? "Closed all day"
                    : `${override.start_time?.slice(0, 5)} – ${override.end_time?.slice(0, 5)}`}
                  {override.note ? ` · ${override.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(override.id)}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
