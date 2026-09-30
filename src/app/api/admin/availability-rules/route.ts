import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/adminSession";

const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

// GET /api/admin/availability-rules
// Admin only. Returns all weekly rule rows (a weekday with no rows is
// closed all day).
// Response 200: { rules: { id, weekday, start_time, end_time }[] }
export async function GET(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("availability_rules")
    .select("id, weekday, start_time, end_time")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("GET /api/admin/availability-rules failed", error);
    return NextResponse.json({ error: "Failed to load availability rules" }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

interface IncomingRule {
  weekday: number;
  startTime: string;
  endTime: string;
}

// PUT /api/admin/availability-rules
// Admin only. Replaces the ENTIRE weekly ruleset with the provided list
// (delete-then-reinsert). Send an empty array to close every day. A
// weekday simply absent from the array is closed all day.
// Request body: { rules: { weekday: number (0-6); startTime: "HH:MM"; endTime: "HH:MM" }[] }
// Response 200: { rules: { id, weekday, start_time, end_time }[] }
export async function PUT(request: NextRequest) {
  if (!requireAdminSession(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { rules?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.rules)) {
    return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
  }

  const rules: IncomingRule[] = [];
  for (const rawRule of body.rules) {
    const rule = rawRule as Partial<IncomingRule>;
    if (
      typeof rule.weekday !== "number" ||
      rule.weekday < 0 ||
      rule.weekday > 6 ||
      typeof rule.startTime !== "string" ||
      !TIME_PATTERN.test(rule.startTime) ||
      typeof rule.endTime !== "string" ||
      !TIME_PATTERN.test(rule.endTime) ||
      rule.endTime <= rule.startTime
    ) {
      return NextResponse.json(
        { error: "Each rule requires weekday (0-6), startTime < endTime as HH:MM" },
        { status: 400 }
      );
    }
    rules.push({ weekday: rule.weekday, startTime: rule.startTime, endTime: rule.endTime });
  }

  const supabase = getSupabaseServiceClient();

  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .gte("weekday", 0);
  if (deleteError) {
    console.error("PUT /api/admin/availability-rules delete failed", deleteError);
    return NextResponse.json({ error: "Failed to replace availability rules" }, { status: 500 });
  }

  if (rules.length === 0) {
    return NextResponse.json({ rules: [] });
  }

  const { data, error: insertError } = await supabase
    .from("availability_rules")
    .insert(
      rules.map((rule) => ({
        weekday: rule.weekday,
        start_time: rule.startTime,
        end_time: rule.endTime,
      }))
    )
    .select("id, weekday, start_time, end_time");

  if (insertError) {
    console.error("PUT /api/admin/availability-rules insert failed", insertError);
    return NextResponse.json({ error: "Failed to replace availability rules" }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}
