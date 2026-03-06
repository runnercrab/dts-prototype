"use server"

import { createClient } from "@supabase/supabase-js"

export async function updateActionStatusAction(
  initiativeId: string,
  status: "pending" | "completed"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    if (!url || !key) return { ok: false, error: "Missing env vars" }

    const sb = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await sb
      .from("dts_v2_initiatives")
      .update({ status })
      .eq("id", initiativeId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}