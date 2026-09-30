import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateServiceBody {
  name?: unknown;
  durationMinutes?: unknown;
  price?: unknown;
  active?: unknown;
}

// PATCH /api/admin/services/[id]
// Admin only. Partially updates a service.
// Request body (all optional): { name?, durationMinutes?, price?, active? }
// Response 200: { service: Service }
// Response 404: { error: "not_found" }
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: UpdateServiceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    update.name = body.name.trim();
  }
  if (body.durationMinutes !== undefined) {
    if (typeof body.durationMinutes !== "number" || body.durationMinutes <= 0) {
      return NextResponse.json(
        { error: "durationMinutes must be a positive number" },
        { status: 400 }
      );
    }
    update.duration_minutes = body.durationMinutes;
  }
  if (body.price !== undefined) {
    if (body.price !== null && typeof body.price !== "number") {
      return NextResponse.json({ error: "price must be a number or null" }, { status: 400 });
    }
    update.price = body.price;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
    }
    update.active = body.active;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .update(update)
    .eq("id", id)
    .select("id, name, duration_minutes, price, active, created_at")
    .maybeSingle();

  if (error) {
    console.error("PATCH /api/admin/services/[id] failed", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ service: data });
}

// DELETE /api/admin/services/[id]
// Admin only. Deletes a service outright.
// Response 200: { ok: true }
// Response 404: { error: "not_found" }
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("DELETE /api/admin/services/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
