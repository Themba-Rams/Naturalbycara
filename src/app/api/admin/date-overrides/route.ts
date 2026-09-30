import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

// GET /api/admin/date-overrides
// Admin only. Returns all date overrides, soonest first.
// Response 200: { overrides: { id, date, is_closed, start_time, end_time, note }[] }
export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("date_overrides")
    .select("id, date, is_closed, start_time, end_time, note")
    .order("date", { ascending: true });

  if (error) {
    console.error("GET /api/admin/date-overrides failed", error);
    return NextResponse.json({ error: "Failed to load date overrides" }, { status: 500 });
  }

  return NextResponse.json({ overrides: data ?? [] });
}

interface CreateOverrideBody {
  date?: unknown;
  isClosed?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  note?: unknown;
}

// POST /api/admin/date-overrides
// Admin only. Creates (or, if `date` already has a row, this will fail with
// a unique-constraint error — use a different date or delete the existing
// override first) a one-off override for a specific date.
// Request body:
//   { date: "YYYY-MM-DD"; isClosed: boolean; startTime?: "HH:MM" | null;
//     endTime?: "HH:MM" | null; note?: string | null }
// Response 201: { override: DateOverride }
export async function POST(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CreateOverrideBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { date, isClosed, startTime, endTime, note } = body;

  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "date is required and must be YYYY-MM-DD" }, { status: 400 });
  }
  if (typeof isClosed !== "boolean") {
    return NextResponse.json({ error: "isClosed is required and must be a boolean" }, { status: 400 });
  }
  if (startTime !== undefined && startTime !== null && (typeof startTime !== "string" || !TIME_PATTERN.test(startTime))) {
    return NextResponse.json({ error: "startTime must be HH:MM or null" }, { status: 400 });
  }
  if (endTime !== undefined && endTime !== null && (typeof endTime !== "string" || !TIME_PATTERN.test(endTime))) {
    return NextResponse.json({ error: "endTime must be HH:MM or null" }, { status: 400 });
  }
  if (note !== undefined && note !== null && typeof note !== "string") {
    return NextResponse.json({ error: "note must be a string or null" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("date_overrides")
    .insert({
      date,
      is_closed: isClosed,
      start_time: startTime ?? null,
      end_time: endTime ?? null,
      note: note ?? null,
    })
    .select("id, date, is_closed, start_time, end_time, note")
    .single();

  if (error) {
    console.error("POST /api/admin/date-overrides failed", error);
    return NextResponse.json({ error: "Failed to create date override" }, { status: 500 });
  }

  return NextResponse.json({ override: data }, { status: 201 });
}
