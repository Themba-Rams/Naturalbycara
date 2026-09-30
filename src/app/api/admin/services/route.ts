import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

// GET /api/admin/services
// Admin only. Returns every service (active and inactive).
// Response 200: { services: Service[] }
export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, active, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("GET /api/admin/services failed", error);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }

  return NextResponse.json({ services: data ?? [] });
}

interface CreateServiceBody {
  name?: unknown;
  durationMinutes?: unknown;
  price?: unknown;
  active?: unknown;
}

// POST /api/admin/services
// Admin only. Creates a new service.
// Request body: { name: string; durationMinutes: number; price?: number | null; active?: boolean }
// Response 201: { service: Service }
// Response 400: { error: string }
export async function POST(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: CreateServiceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, durationMinutes, price, active } = body;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (typeof durationMinutes !== "number" || durationMinutes <= 0) {
    return NextResponse.json(
      { error: "durationMinutes is required and must be a positive number" },
      { status: 400 }
    );
  }
  if (price !== undefined && price !== null && typeof price !== "number") {
    return NextResponse.json({ error: "price must be a number or null" }, { status: 400 });
  }
  if (active !== undefined && typeof active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: name.trim(),
      duration_minutes: durationMinutes,
      price: price ?? null,
      active: active ?? true,
    })
    .select("id, name, duration_minutes, price, active, created_at")
    .single();

  if (error) {
    console.error("POST /api/admin/services failed", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }

  return NextResponse.json({ service: data }, { status: 201 });
}
