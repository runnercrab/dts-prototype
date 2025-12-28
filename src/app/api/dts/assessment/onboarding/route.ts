// src/app/api/dts/assessment/onboarding/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const assessmentId = String(body?.assessmentId || '')
    const onboardingData = body?.onboardingData ?? null

    if (!isUuid(assessmentId)) {
      return NextResponse.json({ ok: false, error: 'assessmentId inválido' }, { status: 400 })
    }
    if (!onboardingData || typeof onboardingData !== 'object') {
      return NextResponse.json({ ok: false, error: 'onboardingData inválido' }, { status: 400 })
    }

    const supabase = supabaseService()

    // Traemos el assessment (para no updatear algo inexistente)
    const { data: existing, error: getErr } = await supabase
      .from('dts_assessments')
      .select('id, started_at')
      .eq('id', assessmentId)
      .single()

    if (getErr || !existing?.id) {
      return NextResponse.json(
        { ok: false, error: getErr?.message || 'Assessment no encontrado' },
        { status: 404 }
      )
    }

    const nowIso = new Date().toISOString()

    const patch: any = {
      onboarding_data: onboardingData,
      phase_0_completed: true,
      status: 'in-progress',
      updated_at: nowIso,
    }

    // Si started_at es null, lo setea una vez
    if (!existing.started_at) patch.started_at = nowIso

    const { error: updErr } = await supabase
      .from('dts_assessments')
      .update(patch)
      .eq('id', assessmentId)

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      assessmentId,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
