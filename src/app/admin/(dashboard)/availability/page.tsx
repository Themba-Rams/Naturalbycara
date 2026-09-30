"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApiClient";

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface Rule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

interface TimeRange {
  start: string;
  end: string;
}

type DayState = {
  open: boolean;
  ranges: TimeRange[];
};

function toHHMM(time: string): string {
  return time.slice(0, 5);
}

function buildInitialState(rules: Rule[]): DayState[] {
  const days: DayState[] = Array.from({ length: 7 }, () => ({ open: false, ranges: [] }));
  for (const rule of rules) {
    days[rule.weekday].open = true;
    days[rule.weekday].ranges.push({
      start: toHHMM(rule.start_time),
      end: toHHMM(rule.end_time),
    });
  }
  for (const day of days) {
    if (day.ranges.length === 0) {
      day.ranges.push({ start: "09:00", end: "17:00" });
    }
  }
  return days;
}

export default function AdminAvailabilityPage() {
  const [days, setDays] = useState<DayState[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ rules: Rule[] }>("/api/admin/availability-rules")
      .then((data) => setDays(buildInitialState(data.rules)))
      .catch(() => setError("Couldn't load availability rules."));
  }, []);

  function updateDay(weekday: number, update: Partial<DayState>) {
    setDays((prev) =>
      prev ? prev.map((d, i) => (i === weekday ? { ...d, ...update } : d)) : prev
    );
  }

  function updateRange(weekday: number, rangeIndex: number, update: Partial<TimeRange>) {
    setDays((prev) =>
      prev
        ? prev.map((d, i) =>
            i === weekday
              ? {
                  ...d,
                  ranges: d.ranges.map((r, j) => (j === rangeIndex ? { ...r, ...update } : r)),
                }
              : d
          )
        : prev
    );
  }

  function addRange(weekday: number) {
    setDays((prev) =>
      prev
        ? prev.map((d, i) =>
            i === weekday ? { ...d, ranges: [...d.ranges, { start: "09:00", end: "17:00" }] } : d
          )
        : prev
    );
  }

  function removeRange(weekday: number, rangeIndex: number) {
    setDays((prev) =>
      prev
        ? prev.map((d, i) =>
            i === weekday
              ? { ...d, ranges: d.ranges.filter((_, j) => j !== rangeIndex) }
              : d
          )
        : prev
    );
  }

  async function handleSave() {
    if (!days) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const rules = days.flatMap((day, weekday) =>
      day.open
        ? day.ranges
            .filter((r) => r.start && r.end)
            .map((r) => ({ weekday, startTime: r.start, endTime: r.end }))
        : []
    );

    try {
      await adminFetch("/api/admin/availability-rules", {
        method: "PUT",
        body: JSON.stringify({ rules }),
      });
      setSaveMessage("Saved.");
    } catch {
      setError(
        "Couldn't save availability. Check that each open day's start time is before its end time."
      );
    } finally {
      setSaving(false);
    }
  }

  if (error && !days) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!days) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-zinc-900">Weekly Availability</h2>
      <div className="flex flex-col gap-4">
        {days.map((day, weekday) => (
          <div key={weekday} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-900">{WEEKDAY_LABELS[weekday]}</span>
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(e) => updateDay(weekday, { open: e.target.checked })}
                />
                Open
              </label>
            </div>
            {day.open && (
              <div className="mt-3 flex flex-col gap-2">
                {day.ranges.map((range, rangeIndex) => (
                  <div key={rangeIndex} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) =>
                        updateRange(weekday, rangeIndex, { start: e.target.value })
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-zinc-500">to</span>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) =>
                        updateRange(weekday, rangeIndex, { end: e.target.value })
                      }
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                    />
                    {day.ranges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRange(weekday, rangeIndex)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRange(weekday)}
                  className="self-start text-sm font-medium text-rose-600 hover:text-rose-800"
                >
                  + Add another time range
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saveMessage && <p className="text-sm text-green-700">{saveMessage}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
