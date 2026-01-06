// ============================================================================
// FILE: src/app/api/dts/responses/get/route.ts
// ROUTE: GET /api/dts/responses/get?assessmentId=...
// PURPOSE: Leer respuestas (incluye derivadas is_complete/gap/weighted_gap).
// ============================================================================

import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = (searchParams.get('assessmentId') || '').trim()

    if (!isUuid(assessmentId)) {
      return NextResponse.json({ ok: false, error: 'assessmentId inválido (uuid requerido)' }, { status: 400 })
    }

    const supabase = supabaseService()

    const { data, error } = await supabase
      .from('dts_responses')
      .select(
        `
        id, assessment_id, criteria_id,
        as_is_level, to_be_level, importance,
        as_is_notes, as_is_confidence,
        to_be_timeframe,
        response_source, inference_confidence, reviewed_by_user,
        criteria_code, subdimension_code, dimension_code,
        created_at, updated_at
      `
      )
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: 'Supabase query error (responses/get)' },
        { status: 500 }
      )
    }

    const enriched = (data || []).map((r: any) => {
      const hasAsIs = r.as_is_level != null
      const hasToBe = r.to_be_level != null
      const hasImp = r.importance != null

      const gap = hasAsIs && hasToBe ? r.to_be_level - r.as_is_level : null
      const weighted_gap = gap != null && hasImp ? gap * r.importance : null
      const is_complete = hasAsIs && hasToBe && hasImp

      return {
        ...r,
        is_complete,
        gap,
        weighted_gap,
      }
    })

    return NextResponse.json({
      ok: true,
      assessmentId,
      responses: enriched,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
