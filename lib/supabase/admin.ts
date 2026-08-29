import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * Server-only client for trusted form ingestion. Never import this from a
 * Client Component and never expose SUPABASE_SERVICE_ROLE_KEY as NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server credentials")
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
