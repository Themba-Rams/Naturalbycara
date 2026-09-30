import { NextRequest, NextResponse } from "next/server";
import { getActiveService, getAvailableSlotsForDate, NotFoundError } from "@/lib/bookingAvailability";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/availability?serviceId=<uuid>&date=YYYY-MM-DD
// Public. Returns the bookable start times for the given service and date.
//
// Response 200:
//   { slots: string[] }   // "HH:MM" 24-hour start times, sorted ascending
// Response 400:
//   { error: string }     // missing/invalid serviceId or date
// Response 404:
//   { error: "service_not_found" }
// Response 500:
//   { error: string }
export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");

  if (!serviceId) {
    return NextResponse.json(
      { error: "Missing required query param: serviceId" },
      { status: 400 }
    );
  }
  if (!date || !DATE_PATTERN.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid required query param: date (expected YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  try {
    const service = await getActiveService(serviceId);
    const slots = await getAvailableSlotsForDate(service.duration_minutes, date);
    return NextResponse.json({ slots });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "service_not_found" }, { status: 404 });
    }
    console.error("GET /api/availability failed", err);
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
