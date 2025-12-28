// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

/**
 * Client Supabase SOLO para casos no-core (auth, storage público, etc.).
 * Regla de oro DTS:
 * - dts_assessments / dts_responses / dts_criteria / dts_chat_messages => SIEMPRE por API routes.
 */
export function supabaseBrowser(): SupabaseClient {
  if (_client) return _client

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  })

  return _client
}
