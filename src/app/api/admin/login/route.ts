import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken } from "@/lib/adminSession";

const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours, matches adminSession.ts

// POST /api/admin/login
// Public (this IS the auth entry point). Body: { password: string }.
// On success, sets an httpOnly signed session cookie and returns 200.
// On failure, returns 401.
//
// Request body:
//   { password: string }
// Response 200:
//   { ok: true }
// Response 400:
//   { error: string }
// Response 401:
//   { error: "invalid_password" }
export async function POST(request: NextRequest) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { password } = body;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD env var is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
