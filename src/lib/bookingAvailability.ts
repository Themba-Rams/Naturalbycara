// Server-only helper that wires the pure computeAvailableSlots logic
// (src/lib/availability.ts) up to Supabase. Shared by GET /api/availability
// (to display slots) and POST /api/bookings (to re-validate a slot is still
// free immediately before inserting, so two people can't double-book the
// same slot).
import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  computeAvailableSlotStrings,
  parseDateOnlyString,
} from "@/lib/availability";

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  active: boolean;
}

export class NotFoundError extends Error {}

/** Fetches an active service by id, or throws NotFoundError. */
export async function getActiveService(serviceId: string): Promise<Service> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, active")
    .eq("id", serviceId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load service: ${error.message}`);
  }
  if (!data) {
    throw new NotFoundError(`Service ${serviceId} not found or inactive`);
  }
  return data;
}

/**
 * Computes the available "HH:MM" start times for a given service and date
 * by loading the weekly rule, any date override, and existing confirmed
 * bookings from Supabase, then delegating to the pure availability logic.
 */
export async function getAvailableSlotsForDate(
  serviceDurationMinutes: number,
  dateStr: string
): Promise<string[]> {
  const supabase = getSupabaseServiceClient();
  const targetDate = parseDateOnlyString(dateStr);
  const weekday = targetDate.getDay();

  const [rulesResult, overrideResult, bookingsResult] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("start_time, end_time")
      .eq("weekday", weekday),
    supabase
      .from("date_overrides")
      .select("is_closed, start_time, end_time")
      .eq("date", dateStr)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("booking_date", dateStr)
      .eq("status", "confirmed"),
  ]);

  if (rulesResult.error) {
    throw new Error(
      `Failed to load availability rules: ${rulesResult.error.message}`
    );
  }
  if (overrideResult.error) {
    throw new Error(
      `Failed to load date override: ${overrideResult.error.message}`
    );
  }
  if (bookingsResult.error) {
    throw new Error(
      `Failed to load existing bookings: ${bookingsResult.error.message}`
    );
  }

  const weeklyRulesForDay = (rulesResult.data ?? []).map((rule) => ({
    startTime: rule.start_time as string,
    endTime: rule.end_time as string,
  }));

  const override = overrideResult.data;
  const dateOverrideForDate = override
    ? {
        isClosed: override.is_closed,
        startTime: (override.start_time as string | null) ?? null,
        endTime: (override.end_time as string | null) ?? null,
      }
    : null;

  const existingBookings = (bookingsResult.data ?? []).map((booking) => ({
    startTime: booking.start_time as string,
    endTime: booking.end_time as string,
  }));

  return computeAvailableSlotStrings({
    weeklyRulesForDay,
    dateOverrideForDate,
    existingBookings,
    serviceDurationMinutes,
    now: new Date(),
    targetDate,
  });
}
