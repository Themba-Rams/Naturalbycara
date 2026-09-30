// Server-only admin session helper.
//
// Cookie/session mechanism: a signed, stateless session cookie. The cookie
// value is `${base64url(payloadJson)}.${base64url(hmacSha256Signature)}`,
// where the payload is `{ exp: <unix ms timestamp> }` and the signature is
// an HMAC-SHA256 over the base64url-encoded payload, keyed with
// `process.env.SESSION_SECRET`. This avoids needing a server-side session
// store (there's a single admin user and no need for revocation lists) and
// uses only Node's built-in `crypto` module, so no extra dependency is
// required.
//
// `SESSION_SECRET` is a dedicated secret, separate from `ADMIN_PASSWORD`,
// so that rotating the login password doesn't invalidate the HMAC key
// derivation logic, and vice versa. Both must be set in the environment.
import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE_NAME = "nbc_admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

interface SessionPayload {
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET environment variable (see .env.local.example)."
    );
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadEncoded: string): string {
  const hmac = createHmac("sha256", getSessionSecret());
  hmac.update(payloadEncoded);
  return hmac.digest("base64url");
}

/** Creates a new signed session token string, valid for SESSION_DURATION_MS. */
export function createAdminSessionToken(): string {
  const payload: SessionPayload = { exp: Date.now() + SESSION_DURATION_MS };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

/** Verifies a session token's signature and expiry. Returns true if valid. */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return false;

  const payloadEncoded = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expectedSignature: string;
  try {
    expectedSignature = sign(payloadEncoded);
  } catch {
    return false;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Checks whether an incoming request carries a valid admin session cookie.
 * Used both by proxy.ts (page gating) and directly inside every
 * /api/admin/* route handler (defense in depth).
 */
export function requireAdminSession(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}
