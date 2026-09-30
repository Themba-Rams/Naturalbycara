import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

// GET /api/admin/bookings
// Admin only. Lists upcoming (today or later) bookings, soonest first,
// with the service name joined in. Pass ?includePast=true to also include
// past bookings; pass ?status=cancelled|confirmed to filter by status
// (defaults to returning both).
// Response 200:
//   { bookings: { id, client_name, client_phone, booking_date, start_time,
//                 end_time, status, service: { id, name } }[] }
export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const includePast = request.nextUrl.searchParams.get("includePast") === "true";
  const statusFilter = request.nextUrl.searchParams.get("status");

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("bookings")
    .select(
      "id, client_name, client_phone, booking_date, start_time, end_time, status, service:services(id, name)"
    )
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!includePast) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    query = query.gte("booking_date", todayStr);
  }

  if (statusFilter === "confirmed" || statusFilter === "cancelled") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/admin/bookings failed", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}
