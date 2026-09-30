import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/bookings/[id]/cancel
// Admin only. Soft-cancels a booking (status -> 'cancelled'), which frees
// the slot since availability queries only count status = 'confirmed'.
// Response 200: { booking: Booking }
// Response 404: { error: "not_found" }
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("id, client_name, client_phone, booking_date, start_time, end_time, status")
    .maybeSingle();

  if (error) {
    console.error("POST /api/admin/bookings/[id]/cancel failed", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ booking: data });
}
