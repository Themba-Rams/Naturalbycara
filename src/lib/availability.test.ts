import { describe, it, expect } from "vitest";
import {
  computeAvailableSlots,
  computeAvailableSlotStrings,
  timeStringToMinutes,
  minutesToTimeString,
  rangesOverlap,
  isSameDate,
  dateToMinutesSinceMidnight,
  parseDateOnlyString,
  type WeeklyRule,
  type DateOverride,
  type ExistingBooking,
} from "./availability";

// Helper: a date far in the future relative to `now`, so isToday is always
// false unless a test explicitly wants to exercise "today" behavior.
const PAST_NOW = new Date(2024, 0, 1, 8, 0); // Jan 1 2024, 08:00 local
const FUTURE_DATE = new Date(2024, 0, 10); // a date that is not "today" relative to PAST_NOW

function h(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

describe("timeStringToMinutes / minutesToTimeString", () => {
  it("converts HH:MM to minutes", () => {
    expect(timeStringToMinutes("00:00")).toBe(0);
    expect(timeStringToMinutes("09:30")).toBe(9 * 60 + 30);
    expect(timeStringToMinutes("23:59")).toBe(23 * 60 + 59);
  });

  it("accepts HH:MM:SS (ignoring seconds)", () => {
    expect(timeStringToMinutes("09:30:00")).toBe(9 * 60 + 30);
  });

  it("throws on invalid strings", () => {
    expect(() => timeStringToMinutes("9")).toThrow();
    expect(() => timeStringToMinutes("24:00")).toThrow();
    expect(() => timeStringToMinutes("12:60")).toThrow();
    expect(() => timeStringToMinutes("ab:cd")).toThrow();
  });

  it("round-trips minutes -> string -> minutes", () => {
    for (const m of [0, 1, 59, 60, 540, 1439]) {
      expect(timeStringToMinutes(minutesToTimeString(m))).toBe(m);
    }
  });

  it("zero-pads the string form", () => {
    expect(minutesToTimeString(h(9, 5))).toBe("09:05");
    expect(minutesToTimeString(0)).toBe("00:00");
  });

  it("throws on out-of-range minute values", () => {
    expect(() => minutesToTimeString(-1)).toThrow();
    expect(() => minutesToTimeString(1440)).toThrow();
  });
});

describe("rangesOverlap", () => {
  it("returns true for genuinely overlapping ranges", () => {
    expect(
      rangesOverlap({ startMinutes: h(9), endMinutes: h(10) }, { startMinutes: h(9, 30), endMinutes: h(10, 30) })
    ).toBe(true);
  });

  it("returns false for adjacent (back-to-back) ranges", () => {
    expect(
      rangesOverlap({ startMinutes: h(9), endMinutes: h(10) }, { startMinutes: h(10), endMinutes: h(11) })
    ).toBe(false);
    expect(
      rangesOverlap({ startMinutes: h(10), endMinutes: h(11) }, { startMinutes: h(9), endMinutes: h(10) })
    ).toBe(false);
  });

  it("returns false for completely disjoint ranges", () => {
    expect(
      rangesOverlap({ startMinutes: h(9), endMinutes: h(10) }, { startMinutes: h(14), endMinutes: h(15) })
    ).toBe(false);
  });

  it("returns true when one range fully contains the other", () => {
    expect(
      rangesOverlap({ startMinutes: h(9), endMinutes: h(17) }, { startMinutes: h(10), endMinutes: h(11) })
    ).toBe(true);
  });
});

describe("isSameDate", () => {
  it("true for same calendar date regardless of time", () => {
    expect(isSameDate(new Date(2024, 0, 1, 0, 0), new Date(2024, 0, 1, 23, 59))).toBe(true);
  });
  it("false for different dates", () => {
    expect(isSameDate(new Date(2024, 0, 1), new Date(2024, 0, 2))).toBe(false);
  });
});

describe("dateToMinutesSinceMidnight", () => {
  it("computes minutes from local time", () => {
    expect(dateToMinutesSinceMidnight(new Date(2024, 0, 1, 9, 30))).toBe(h(9, 30));
  });
});

describe("parseDateOnlyString", () => {
  it("parses a valid date string as local midnight", () => {
    const d = parseDateOnlyString("2024-03-15");
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });
  it("throws on invalid strings", () => {
    expect(() => parseDateOnlyString("2024-13-01")).toThrow();
    expect(() => parseDateOnlyString("not-a-date")).toThrow();
  });
});

describe("computeAvailableSlots — weekly rules & overrides", () => {
  it("returns zero slots when there is no rule for the weekday (closed)", () => {
    const slots = computeAvailableSlots({
      weeklyRulesForDay: [],
      dateOverrideForDate: null,
      existingBookings: [],
      serviceDurationMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(slots).toEqual([]);
  });

  it("date override that fully closes an otherwise-open day yields zero slots", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(17) }];
    const dateOverrideForDate: DateOverride = {
      isClosed: true,
      startMinutes: null,
      endMinutes: null,
    };
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate,
      existingBookings: [],
      serviceDurationMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(slots).toEqual([]);
  });

  it("date override with custom hours takes precedence over the weekly rule", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(17) }];
    const dateOverrideForDate: DateOverride = {
      isClosed: false,
      startMinutes: h(12),
      endMinutes: h(14),
    };
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate,
      existingBookings: [],
      serviceDurationMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    // Should only produce slots within 12:00-14:00, not the 9-17 weekly range.
    expect(slots).toEqual([h(12), h(12, 30), h(13), h(13, 30)]);
    expect(slots).not.toContain(h(9));
    expect(slots).not.toContain(h(16, 30));
  });

  it("override with isClosed=false but no hours falls back to the weekly rule", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(10) }];
    const dateOverrideForDate: DateOverride = {
      isClosed: false,
      startMinutes: null,
      endMinutes: null,
    };
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate,
      existingBookings: [],
      serviceDurationMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(slots).toEqual([h(9), h(9, 30)]);
  });
});

describe("computeAvailableSlots — back-to-back bookings", () => {
  it("a booking ending exactly when the next slot starts does not block that slot", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(12) }];
    // Two adjacent bookings: 09:00-10:00 and 10:00-11:00. Only the 09:00 and
    // 10:00 slots themselves are occupied; the gap between them (exactly at
    // 10:00) must not be spuriously blocked, and 11:00 onward remains open.
    const existingBookings: ExistingBooking[] = [
      { startMinutes: h(9), endMinutes: h(10) },
      { startMinutes: h(10), endMinutes: h(11) },
    ];
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings,
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 60,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    // 09:00 and 10:00 are occupied (overlap with a booking); 11:00 is free.
    expect(slots).toEqual([h(11)]);
  });

  it("a slot that truly overlaps either booking is excluded", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(12) }];
    const existingBookings: ExistingBooking[] = [
      { startMinutes: h(9), endMinutes: h(10) },
      { startMinutes: h(10), endMinutes: h(11) },
    ];
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings,
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    // 09:00, 09:30, 10:00, 10:30 all overlap one of the two bookings.
    expect(slots).not.toContain(h(9));
    expect(slots).not.toContain(h(9, 30));
    expect(slots).not.toContain(h(10));
    expect(slots).not.toContain(h(10, 30));
    // 11:00 and 11:30 are free.
    expect(slots).toEqual(expect.arrayContaining([h(11), h(11, 30)]));
  });
});

describe("computeAvailableSlots — closing-time boundary", () => {
  it("allows a slot whose end exactly equals closing time", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(17) }];
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings: [],
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    // 16:00 + 60min = 17:00 exactly == closing time -> must be allowed.
    expect(slots).toContain(h(16));
    // 16:30 + 60min = 17:30 > closing time -> must be excluded.
    expect(slots).not.toContain(h(16, 30));
  });
});

describe("computeAvailableSlots — duration correctly factored into overlap check", () => {
  it("a longer service is excluded from a start time a shorter service would still accept", () => {
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(12) }];
    // Existing booking 10:00-10:30.
    const existingBookings: ExistingBooking[] = [{ startMinutes: h(10), endMinutes: h(10, 30) }];

    // A 30-minute service starting at 09:30 ends at 10:00 -> no overlap, allowed.
    const shortSlots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings,
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(shortSlots).toContain(h(9, 30));

    // A 60-minute service starting at 09:30 would end at 10:30, which
    // overlaps the 10:00-10:30 booking -> must be excluded, even though the
    // raw start time (09:30) does not equal the booking's start time.
    const longSlots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings,
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(longSlots).not.toContain(h(9, 30));
  });
});

describe("computeAvailableSlots — split shifts / multiple ranges per day", () => {
  it("generates slots in both ranges and none in the gap between them", () => {
    const weeklyRulesForDay: WeeklyRule[] = [
      { startMinutes: h(9), endMinutes: h(12) },
      { startMinutes: h(13), endMinutes: h(17) },
    ];
    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    // Morning range slots present.
    expect(slots).toEqual(
      expect.arrayContaining([h(9), h(9, 30), h(10), h(10, 30), h(11), h(11, 30)])
    );
    // Afternoon range slots present.
    expect(slots).toEqual(
      expect.arrayContaining([h(13), h(13, 30), h(14), h(16), h(16, 30)])
    );
    // The lunch gap (12:00-13:00) must not contain any slots.
    expect(slots).not.toContain(h(12));
    expect(slots).not.toContain(h(12, 30));
    // Sorted overall.
    const sorted = [...slots].sort((a, b) => a - b);
    expect(slots).toEqual(sorted);
  });
});

describe("computeAvailableSlots — today cutoff", () => {
  it("excludes already-passed slot start times on the current date", () => {
    const targetDate = new Date(2024, 5, 10); // June 10, 2024
    const now = new Date(2024, 5, 10, 11, 15); // same date, 11:15
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(17) }];

    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now,
      targetDate,
    });

    // Slots strictly before 11:15 are gone.
    expect(slots).not.toContain(h(9));
    expect(slots).not.toContain(h(10, 30));
    expect(slots).not.toContain(h(11));
    // Future slots remain.
    expect(slots).toContain(h(11, 30));
    expect(slots).toContain(h(16));
  });

  it("a future date is unaffected by now's time-of-day", () => {
    const targetDate = new Date(2024, 5, 11); // a day after `now`'s date
    const now = new Date(2024, 5, 10, 23, 45); // late in the previous day
    const weeklyRulesForDay: WeeklyRule[] = [{ startMinutes: h(9), endMinutes: h(11) }];

    const slots = computeAvailableSlots({
      weeklyRulesForDay,
      dateOverrideForDate: null,
      existingBookings: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now,
      targetDate,
    });

    expect(slots).toEqual([h(9), h(9, 30), h(10), h(10, 30)]);
  });
});

describe("computeAvailableSlotStrings — string-based wrapper", () => {
  it("mirrors computeAvailableSlots but with HH:MM in and out", () => {
    const slots = computeAvailableSlotStrings({
      weeklyRulesForDay: [{ startTime: "09:00", endTime: "10:30" }],
      dateOverrideForDate: null,
      existingBookings: [{ startTime: "09:30", endTime: "10:00" }],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(slots).toEqual(["09:00", "10:00"]);
  });

  it("applies a fully-closed date override expressed as strings", () => {
    const slots = computeAvailableSlotStrings({
      weeklyRulesForDay: [{ startTime: "09:00", endTime: "17:00" }],
      dateOverrideForDate: { isClosed: true, startTime: null, endTime: null },
      existingBookings: [],
      serviceDurationMinutes: 30,
      now: PAST_NOW,
      targetDate: FUTURE_DATE,
    });
    expect(slots).toEqual([]);
  });
});

describe("computeAvailableSlots — input validation", () => {
  it("throws for non-positive serviceDurationMinutes", () => {
    expect(() =>
      computeAvailableSlots({
        weeklyRulesForDay: [{ startMinutes: h(9), endMinutes: h(17) }],
        dateOverrideForDate: null,
        existingBookings: [],
        serviceDurationMinutes: 0,
        now: PAST_NOW,
        targetDate: FUTURE_DATE,
      })
    ).toThrow();
  });

  it("throws for non-positive slotIntervalMinutes", () => {
    expect(() =>
      computeAvailableSlots({
        weeklyRulesForDay: [{ startMinutes: h(9), endMinutes: h(17) }],
        dateOverrideForDate: null,
        existingBookings: [],
        serviceDurationMinutes: 30,
        slotIntervalMinutes: -15,
        now: PAST_NOW,
        targetDate: FUTURE_DATE,
      })
    ).toThrow();
  });
});
