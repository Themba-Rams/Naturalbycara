"use client";

import { useMemo, useState } from "react";
import { toLocalDateString } from "@/lib/formatting";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min: string;
  max: string;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Hand-rolled month-grid calendar. Selectable range is [min, max] inclusive
 * (the caller passes today..today+30 days, computed via the shared
 * formatting.ts helpers). Drop-in replacement for the previous
 * <input type="date">: same onChange(dateStr) contract.
 */
export default function DatePicker({ value, onChange, min, max }: DatePickerProps) {
  const minDate = useMemo(() => parseDateString(min), [min]);
  const maxDate = useMemo(() => parseDateString(max), [max]);
  const todayStr = min; // BookingFlow always passes `today` as min.

  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(value ? parseDateString(value) : minDate)
  );

  const minMonth = startOfMonth(minDate);
  const maxMonth = startOfMonth(maxDate);

  const canGoPrev = !isSameMonth(visibleMonth, minMonth) && visibleMonth > minMonth;
  const canGoNext = !isSameMonth(visibleMonth, maxMonth) && visibleMonth < maxMonth;

  const weeks = useMemo(() => {
    const firstOfMonth = startOfMonth(visibleMonth);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0
    ).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [visibleMonth]);

  function goPrev() {
    if (!canGoPrev) return;
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goNext() {
    if (!canGoNext) return;
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function isDisabled(date: Date): boolean {
    const str = toLocalDateString(date);
    return str < min || str > max;
  }

  function handleSelect(date: Date) {
    if (isDisabled(date)) return;
    onChange(toLocalDateString(date));
  }

  const monthLabel = visibleMonth.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="glass-card max-w-sm px-2 py-6 shadow-2xl sm:p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors duration-150 ease-out hover:bg-white/5 hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-muted-disabled disabled:hover:bg-transparent"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="font-display text-lg font-medium text-text-primary">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next month"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors duration-150 ease-out hover:bg-white/5 hover:text-accent-hover disabled:cursor-not-allowed disabled:text-text-muted-disabled disabled:hover:bg-transparent"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-xs font-semibold uppercase tracking-wider text-text-muted"
          >
            {label}
          </span>
        ))}
      </div>

      <div
        key={monthLabel}
        className="mt-1 grid grid-cols-7 gap-y-1 text-center transition-opacity duration-200 ease-in-out"
      >
        {weeks.flatMap((row, ri) =>
          row.map((date, ci) => {
            if (!date) return <span key={`${ri}-${ci}`} />;
            const dateStr = toLocalDateString(date);
            const disabled = isDisabled(date);
            const selected = value === dateStr;
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className="flex items-center justify-center py-0.5">
                <button
                  type="button"
                  onClick={() => handleSelect(date)}
                  disabled={disabled}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={selected}
                  className={[
                    "flex h-11 w-11 min-w-[44px] flex-shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-150 ease-out",
                    disabled
                      ? "cursor-not-allowed text-text-muted-disabled"
                      : selected
                        ? "scale-105 bg-accent text-accent-contrast-text shadow-sm"
                        : isToday
                          ? "text-text-primary ring-1 ring-accent/50 hover:bg-white/5 hover:text-accent-hover"
                          : "text-text-primary hover:bg-white/5 hover:text-accent-hover",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
