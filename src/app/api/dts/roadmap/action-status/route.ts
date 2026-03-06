import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { assessmentId, actionId, status } = await req.json()

    if (!assessmentId || !actionId || !["pending", "completed"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid params" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 })
    }

    const sb = createClient(url, key, { auth: { persistSession: false } })

    const { error } = await sb
      .from("dts_action_status")
      .upsert(
        { assessment_id: assessmentId, action_id: actionId, status, updated_at: new Date().toISOString() },
        { onConflict: "assessment_id,action_id" }
      )

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}