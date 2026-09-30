// Pure slot-computation logic for the booking system.
//
// This module has NO dependency on Supabase, Next.js, or any I/O — every
// function takes plain data in and returns plain data out, so it can be
// unit tested directly with in-memory fixtures.
//
// Times are represented in two ways:
//   - "HH:MM" 24-hour strings at the module's public boundary (matches
//     Postgres `time` columns rendered as text, and is what the API
//     returns to the frontend).
//   - minutes-since-midnight (a plain number, 0-1439) internally, because
//     it's far easier to do arithmetic/overlap checks on numbers than on
//     strings.

/** An inclusive-start, exclusive-end range expressed in minutes since midnight. */
export interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

/** One row of the weekly recurring schedule for a single weekday. */
export interface WeeklyRule {
  startMinutes: number;
  endMinutes: number;
}

/** A one-off override for a specific calendar date. */
export interface DateOverride {
  isClosed: boolean;
  startMinutes: number | null;
  endMinutes: number | null;
}

/** An existing confirmed booking's occupied time range for the target date. */
export interface ExistingBooking {
  startMinutes: number;
  endMinutes: number;
}

export interface ComputeAvailableSlotsParams {
  /** The open ranges from the weekly recurring rule for this weekday (may be empty = closed all day). */
  weeklyRulesForDay: WeeklyRule[];
  /** Any date-specific override for the target date, or null/undefined if none exists. */
  dateOverrideForDate: DateOverride | null | undefined;
  /** All existing confirmed bookings on the target date. */
  existingBookings: ExistingBooking[];
  /** How long the requested service takes. */
  serviceDurationMinutes: number;
  /** Step between candidate slot start times. Defaults to 30 minutes. */
  slotIntervalMinutes?: number;
  /** The current instant, used to filter out past slots when targetDate is today. */
  now: Date;
  /** The calendar date the slots are being computed for. */
  targetDate: Date;
}

const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

/** Converts an "HH:MM" or "HH:MM:SS" string to minutes since midnight. */
export function timeStringToMinutes(time: string): number {
  const parts = time.split(":");
  if (parts.length < 2) {
    throw new Error(`Invalid time string: "${time}"`);
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time string: "${time}"`);
  }
  return hours * 60 + minutes;
}

/** Converts minutes since midnight to a zero-padded "HH:MM" string. */
export function minutesToTimeString(totalMinutes: number): string {
  if (
    !Number.isInteger(totalMinutes) ||
    totalMinutes < 0 ||
    totalMinutes >= MINUTES_PER_DAY
  ) {
    throw new Error(`Invalid minutes value: ${totalMinutes}`);
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Standard half-open interval overlap check: [aStart, aEnd) vs [bStart, bEnd).
 * Ranges that only touch at an endpoint (a ends exactly when b starts, or
 * vice versa) are NOT considered overlapping — back-to-back bookings are
 * allowed.
 */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/** Returns true if two Date objects fall on the same calendar date (local time). */
export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns the number of minutes since midnight for a Date, in local time. */
export function dateToMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Parses a "YYYY-MM-DD" calendar date string into a local-midnight Date.
 * Deliberately avoids `new Date("YYYY-MM-DD")`, which parses as UTC
 * midnight and can shift to the previous/next day (and therefore the
 * wrong weekday) depending on the server's local timezone offset.
 */
export function parseDateOnlyString(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  return date;
}

/**
 * Determines the set of open time ranges for a single day, applying the
 * date-override-over-weekly-rule precedence described in supabase/schema.sql.
 */
function resolveOpenRanges(
  weeklyRulesForDay: WeeklyRule[],
  dateOverrideForDate: DateOverride | null | undefined
): TimeRange[] {
  if (dateOverrideForDate) {
    if (dateOverrideForDate.isClosed) {
      return [];
    }
    if (
      dateOverrideForDate.startMinutes != null &&
      dateOverrideForDate.endMinutes != null
    ) {
      return [
        {
          startMinutes: dateOverrideForDate.startMinutes,
          endMinutes: dateOverrideForDate.endMinutes,
        },
      ];
    }
    // is_closed is false but no explicit hours were given: fall through to
    // the weekly rule for this weekday.
  }

  return weeklyRulesForDay.map((rule) => ({
    startMinutes: rule.startMinutes,
    endMinutes: rule.endMinutes,
  }));
}

/**
 * Computes the sorted list of bookable slot start times (in minutes since
 * midnight) for a given day, service duration, and existing bookings.
 */
export function computeAvailableSlots(
  params: ComputeAvailableSlotsParams
): number[] {
  const {
    weeklyRulesForDay,
    dateOverrideForDate,
    existingBookings,
    serviceDurationMinutes,
    slotIntervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES,
    now,
    targetDate,
  } = params;

  if (serviceDurationMinutes <= 0) {
    throw new Error("serviceDurationMinutes must be positive");
  }
  if (slotIntervalMinutes <= 0) {
    throw new Error("slotIntervalMinutes must be positive");
  }

  const openRanges = resolveOpenRanges(weeklyRulesForDay, dateOverrideForDate);
  const isToday = isSameDate(now, targetDate);
  const nowMinutes = dateToMinutesSinceMidnight(now);

  const slots: number[] = [];

  for (const range of openRanges) {
    for (
      let candidateStart = range.startMinutes;
      candidateStart + serviceDurationMinutes <= range.endMinutes;
      candidateStart += slotIntervalMinutes
    ) {
      if (isToday && candidateStart < nowMinutes) {
        continue;
      }

      const candidateRange: TimeRange = {
        startMinutes: candidateStart,
        endMinutes: candidateStart + serviceDurationMinutes,
      };

      const conflicts = existingBookings.some((booking) =>
        rangesOverlap(candidateRange, booking)
      );

      if (!conflicts) {
        slots.push(candidateStart);
      }
    }
  }

  return slots.sort((a, b) => a - b);
}

/**
 * Convenience wrapper around computeAvailableSlots that accepts/returns
 * "HH:MM" strings instead of raw minute numbers, for callers (route
 * handlers) that prefer to work with the same string format as the
 * database and the API contract.
 */
export function computeAvailableSlotStrings(params: {
  weeklyRulesForDay: { startTime: string; endTime: string }[];
  dateOverrideForDate:
    | { isClosed: boolean; startTime: string | null; endTime: string | null }
    | null
    | undefined;
  existingBookings: { startTime: string; endTime: string }[];
  serviceDurationMinutes: number;
  slotIntervalMinutes?: number;
  now: Date;
  targetDate: Date;
}): string[] {
  const weeklyRulesForDay: WeeklyRule[] = params.weeklyRulesForDay.map(
    (rule) => ({
      startMinutes: timeStringToMinutes(rule.startTime),
      endMinutes: timeStringToMinutes(rule.endTime),
    })
  );

  const dateOverrideForDate: DateOverride | null | undefined =
    params.dateOverrideForDate
      ? {
          isClosed: params.dateOverrideForDate.isClosed,
          startMinutes: params.dateOverrideForDate.startTime
            ? timeStringToMinutes(params.dateOverrideForDate.startTime)
            : null,
          endMinutes: params.dateOverrideForDate.endTime
            ? timeStringToMinutes(params.dateOverrideForDate.endTime)
            : null,
        }
      : params.dateOverrideForDate;

  const existingBookings: ExistingBooking[] = params.existingBookings.map(
    (booking) => ({
      startMinutes: timeStringToMinutes(booking.startTime),
      endMinutes: timeStringToMinutes(booking.endTime),
    })
  );

  const slotMinutes = computeAvailableSlots({
    weeklyRulesForDay,
    dateOverrideForDate,
    existingBookings,
    serviceDurationMinutes: params.serviceDurationMinutes,
    slotIntervalMinutes: params.slotIntervalMinutes,
    now: params.now,
    targetDate: params.targetDate,
  });

  return slotMinutes.map(minutesToTimeString);
}
