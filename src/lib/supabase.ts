// SERVER-ONLY. Do not import this file from a Client Component or any
// code that could end up in a browser bundle — it holds a factory for a
// Supabase client authenticated with the SERVICE ROLE key, which has full
// access to the database and bypasses Row Level Security entirely.
//
// This module should only ever be imported from Route Handlers
// (src/app/api/**/route.ts) or other server-only utilities.
import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client authenticated with the service role
 * key. Env vars are read lazily (inside this function, not at module load)
 * so that importing this file never breaks the build when env vars are
 * absent at build time — the error only surfaces when a route handler
 * actually tries to talk to Supabase at request time.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server configuration: NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY must both be set (see .env.local.example)."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
