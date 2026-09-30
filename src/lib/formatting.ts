// UI-only formatting helpers shared by the public booking flow and the
// admin dashboard. Deliberately separate from src/lib/availability.ts
// (booking-domain logic), which is off-limits — this file only formats
// strings for display, it doesn't compute availability.

/** Returns today's date as a local "YYYY-MM-DD" string (not UTC). */
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}

/** Formats a Date as a local "YYYY-MM-DD" string. */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Adds `days` days to a "YYYY-MM-DD" string and returns a new "YYYY-MM-DD" string. */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

/** Formats a "YYYY-MM-DD" string as e.g. "Mon, 5 Jan". */
export function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Formats an "HH:MM" 24-hour string as e.g. "9:00 AM". */
export function formatTimeForDisplay(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** Formats a price (rands) for display, e.g. 250 -> "R250". Returns null if price is null. */
export function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return `R${price % 1 === 0 ? price : price.toFixed(2)}`;
}
