import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/adminSession";

// POST /api/admin/logout
// Clears the admin session cookie.
//
// Response 200:
//   { ok: true }
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
  return response;
}
