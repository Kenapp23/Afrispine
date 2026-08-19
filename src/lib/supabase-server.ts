/**
 * Server-side Supabase client.
 *
 * Uses service_role or anon key depending on context.
 * Gracefully degrades when env vars are not set.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseReady = !!(supabaseUrl && (supabaseAnonKey || supabaseServiceKey))

/** Anon-key client (safe for client-side-like contexts on the server) */
export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(supabaseUrl!, supabaseAnonKey || supabaseServiceKey!)
  : null

/** Admin/service-role client (bypasses RLS) */
export const supabaseAdmin: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null
