import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  getActiveService,
  getAvailableSlotsForDate,
  NotFoundError,
} from "@/lib/bookingAvailability";
import { minutesToTimeString, timeStringToMinutes } from "@/lib/availability";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

interface CreateBookingBody {
  serviceId?: unknown;
  date?: unknown;
  startTime?: unknown;
  clientName?: unknown;
  clientPhone?: unknown;
}

// POST /api/bookings
// Public. Creates a new confirmed booking, after re-validating server-side
// that the requested slot is still free (never trusts the client's view of
// availability) — this prevents double-booking when two people try to book
// the same slot at nearly the same time, or when a client's page is stale.
//
// Request body:
//   { serviceId: string; date: "YYYY-MM-DD"; startTime: "HH:MM";
//     clientName: string; clientPhone: string }
//
// Response 201:
//   { booking: { id, service_id, client_name, client_phone, booking_date,
//                start_time, end_time, status } }
// Response 400:
//   { error: string }               // validation failure
// Response 404:
//   { error: "service_not_found" }
// Response 409:
//   { error: "slot_taken" }         // slot no longer available
// Response 500:
//   { error: string }
export async function POST(request: NextRequest) {
  let body: CreateBookingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { serviceId, date, startTime, clientName, clientPhone } = body;

  if (typeof serviceId !== "string" || serviceId.length === 0) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { error: "date is required and must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  if (typeof startTime !== "string" || !TIME_PATTERN.test(startTime)) {
    return NextResponse.json(
      { error: "startTime is required and must be HH:MM" },
      { status: 400 }
    );
  }
  if (typeof clientName !== "string" || clientName.trim().length === 0) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }
  if (typeof clientPhone !== "string" || clientPhone.trim().length === 0) {
    return NextResponse.json({ error: "clientPhone is required" }, { status: 400 });
  }

  try {
    const service = await getActiveService(serviceId);

    // Re-validate: recompute availability right now and confirm the
    // requested startTime is still in the list of open slots.
    const availableSlots = await getAvailableSlotsForDate(
      service.duration_minutes,
      date
    );
    if (!availableSlots.includes(startTime)) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }

    const endTime = minutesToTimeString(
      timeStringToMinutes(startTime) + service.duration_minutes
    );

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        service_id: service.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        status: "confirmed",
      })
      .select("id, service_id, client_name, client_phone, booking_date, start_time, end_time, status")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    console.error("POST /api/bookings failed", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
