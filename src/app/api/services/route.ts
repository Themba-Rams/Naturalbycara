import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

// GET /api/services
// Public. Returns the list of active services clients can book.
//
// Response 200:
//   { services: { id: string; name: string; duration_minutes: number; price: number | null }[] }
// Response 500:
//   { error: string }
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ services: data ?? [] });
  } catch (err) {
    console.error("GET /api/services failed", err);
    return NextResponse.json(
      { error: "Failed to load services" },
      { status: 500 }
    );
  }
}
