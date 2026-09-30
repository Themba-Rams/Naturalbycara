import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/date-overrides/[id]
// Admin only. Removes a date override (the weekday's normal rule applies again).
// Response 200: { ok: true }
// Response 404: { error: "not_found" }
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("date_overrides")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("DELETE /api/admin/date-overrides/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete date override" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
