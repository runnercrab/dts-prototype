// ============================================================================
// FILE: src/app/api/dts/responses/route.ts
// ROUTE: POST /api/dts/responses
// PURPOSE:
// - Guardar respuestas parciales o completas
// - VALIDAR que criteria pertenece al pack del assessment
// - Upsert REAL (no pisar campos no enviados)
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Confidence = 'low' | 'medium' | 'high'
type Timeframe = '6months' | '1year' | '2years' | '3years+'

type Body = {
  assessmentId: string
  criteriaId: string
  response: {
    as_is_level?: number | null
    to_be_level?: number | null
    importance?: number | null
    as_is_notes?: string | null
    as_is_confidence?: Confidence | null
    to_be_timeframe?: Timeframe | null
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing env: SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function isIntBetween(x: unknown, min: number, max: number) {
  return Number.isInteger(x) && (x as number) >= min && (x as number) <= max
}

function validateOptionalLikert(field: string, v: unknown) {
  if (v == null) return null
  if (!isIntBetween(v, 1, 5)) return `${field} must be integer 1..5`
  return null
}

function validateOptionalEnum<T extends string>(
  field: string,
  v: unknown,
  allowed: readonly T[]
) {
  if (v == null) return null
  if (typeof v !== 'string') return `${field} must be string`
  if (!allowed.includes(v as T)) return `${field} must be one of ${allowed.join(', ')}`
  return null
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const requestId = `responses_${Date.now()}_${Math.random().toString(16).slice(2)}`

  try {
    const body = (await req.json()) as Body

    if (!body?.assessmentId || !body?.criteriaId || !body?.response) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Missing assessmentId / criteriaId / response' },
        { status: 400 }
      )
    }

    const assessmentId = body.assessmentId.trim()
    const criteriaId = body.criteriaId.trim()

    if (!isUuid(assessmentId) || !isUuid(criteriaId)) {
      return NextResponse.json(
        { ok: false, requestId, error: 'assessmentId / criteriaId inválido (uuid)' },
        { status: 400 }
      )
    }

    const r = body.response

    // ---------------------------------------------------------------------
    // 1) Validaciones SOLO de lo enviado
    // ---------------------------------------------------------------------
    const errors = [
      validateOptionalLikert('as_is_level', r.as_is_level),
      validateOptionalLikert('to_be_level', r.to_be_level),
      validateOptionalLikert('importance', r.importance),
      validateOptionalEnum('as_is_confidence', r.as_is_confidence, ['low', 'medium', 'high'] as const),
      validateOptionalEnum('to_be_timeframe', r.to_be_timeframe, ['6months', '1year', '2years', '3years+'] as const),
    ].filter(Boolean) as string[]

    if (errors.length) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Validation error', details: errors },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // ---------------------------------------------------------------------
    // 2) Resolver pack del assessment
    // ---------------------------------------------------------------------
    const { data: aRow, error: aErr } = await supabase
      .from('dts_assessments')
      .select('id, pack')
      .eq('id', assessmentId)
      .single()

    if (aErr || !aRow?.pack) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Assessment no encontrado o sin pack' },
        { status: 404 }
      )
    }

    const pack = String(aRow.pack)

    // ---------------------------------------------------------------------
    // 3) VALIDACIÓN CRÍTICA: criteria ∈ pack
    // Fuente de verdad: dts_pack_criteria
    // ---------------------------------------------------------------------
    const { data: pcRow, error: pcErr } = await supabase
      .from('dts_pack_criteria')
      .select('criteria_id')
      .eq('pack', pack)
      .eq('criteria_id', criteriaId)
      .maybeSingle()

    if (pcErr) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Error validando pack-criteria', details: pcErr.message },
        { status: 500 }
      )
    }

    if (!pcRow) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: 'criteria no pertenece al pack del assessment',
          pack,
          criteriaId,
        },
        { status: 409 }
      )
    }

    // ---------------------------------------------------------------------
    // 4) Leer respuesta existente (para MERGE parcial)
    // ---------------------------------------------------------------------
    const { data: existing } = await supabase
      .from('dts_responses')
      .select(
        `
        as_is_level,
        to_be_level,
        importance,
        as_is_notes,
        as_is_confidence,
        to_be_timeframe
      `
      )
      .eq('assessment_id', assessmentId)
      .eq('criteria_id', criteriaId)
      .maybeSingle()

    const notesTrimmed =
      typeof r.as_is_notes === 'string' ? r.as_is_notes.trim() : null

    const merged = {
      as_is_level: r.as_is_level ?? existing?.as_is_level ?? null,
      to_be_level: r.to_be_level ?? existing?.to_be_level ?? null,
      importance: r.importance ?? existing?.importance ?? null,
      as_is_notes: notesTrimmed ?? existing?.as_is_notes ?? null,
      as_is_confidence: r.as_is_confidence ?? existing?.as_is_confidence ?? null,
      to_be_timeframe: r.to_be_timeframe ?? existing?.to_be_timeframe ?? null,
    }

    const hasAsIs = merged.as_is_level != null
    const hasToBe = merged.to_be_level != null
    const hasImp = merged.importance != null

    const gap = hasAsIs && hasToBe ? merged.to_be_level! - merged.as_is_level! : null
    const weighted_gap = gap != null && hasImp ? gap * merged.importance! : null
    const is_complete = hasAsIs && hasToBe && hasImp

    // ---------------------------------------------------------------------
    // 5) UPSERT seguro
    // ---------------------------------------------------------------------
    const { data, error } = await supabase
      .from('dts_responses')
      .upsert(
        {
          assessment_id: assessmentId,
          criteria_id: criteriaId,
          ...merged,
          response_source: 'manual',
          reviewed_by_user: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'assessment_id,criteria_id' }
      )
      .select(
        'id, assessment_id, criteria_id, as_is_level, to_be_level, importance, updated_at'
      )
      .single()

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: 'Supabase upsert failed',
          supabase: {
            message: error.message,
            code: (error as any).code,
            details: (error as any).details,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      requestId,
      saved: data,
      derived: {
        is_complete,
        gap,
        weighted_gap,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Unexpected server error', message: e?.message },
      { status: 500 }
    )
  }
}
