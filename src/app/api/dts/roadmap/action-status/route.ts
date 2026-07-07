import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { assertDtsWritesAllowedInThisEnvironment } from "@/lib/dts/prodGate"

// M3 · Ejecución mínima /dts — desbloqueo ACOTADO del firewall 005 para este
// único handler y SOLO para gapply_v23. El pack se verifica en servidor por
// SELECT directo sobre dts_assessments (tabla neutra, sin RPC) ANTES del upsert.
// Los packs legacy siguen gateados por prodGate tal cual (005 intacto).
// Solo marca/desmarca (pending/completed); upsert directo; nada de responsables,
// notas, horas, validación de impacto, activar/cerrar programa.
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

    // Verificación de pack en servidor (SELECT directo, sin RPC) antes de escribir.
    const { data: asm, error: asmErr } = await sb
      .from("dts_assessments")
      .select("pack")
      .eq("id", assessmentId)
      .maybeSingle()

    if (asmErr) return NextResponse.json({ ok: false, error: asmErr.message }, { status: 500 })
    if (!asm) return NextResponse.json({ ok: false, error: "Assessment not found" }, { status: 404 })

    // Desbloqueo acotado: SOLO gapply_v23 salta el firewall 005. El resto queda
    // gateado exactamente como antes (403 en prod; preview/local sin cambio).
    if (asm.pack !== "gapply_v23") {
      const blocked = assertDtsWritesAllowedInThisEnvironment()
      if (blocked) return blocked
    }

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