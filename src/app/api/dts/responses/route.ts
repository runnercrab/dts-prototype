// ============================================================================
// FILE: src/app/api/dts/responses/route.ts
// ROUTE: POST /api/dts/responses
// PURPOSE: Guardar SIEMPRE en BD (parcial permitido). Completo = AS-IS+TO-BE+IMPORTANCIA.
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
    // Core (parciales permitidos)
    as_is_level?: number | null
    to_be_level?: number | null
    importance?: number | null
    as_is_notes?: string | null

    // Opcional (guardamos null si no viene)
    as_is_confidence?: Confidence | null
    to_be_timeframe?: Timeframe | null
  }
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function isIntBetween(x: unknown, min: number, max: number) {
  return Number.isInteger(x) && (x as number) >= min && (x as number) <= max
}

function validateOptionalLikert(fieldName: string, v: unknown) {
  if (v == null) return null // parcial permitido
  if (!isIntBetween(v, 1, 5)) return `${fieldName} must be an integer 1..5`
  return null
}

function validateOptionalEnum<T extends string>(fieldName: string, v: unknown, allowed: readonly T[]) {
  if (v == null) return null
  if (typeof v !== 'string') return `${fieldName} must be a string`
  if (!allowed.includes(v as T)) return `${fieldName} must be one of: ${allowed.join(', ')}`
  return null
}

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

    const assessmentId = String(body.assessmentId).trim()
    const criteriaId = String(body.criteriaId).trim()

    if (!isUuid(assessmentId)) {
      return NextResponse.json(
        { ok: false, requestId, error: 'assessmentId inválido (uuid requerido)' },
        { status: 400 }
      )
    }

    if (!isUuid(criteriaId)) {
      return NextResponse.json(
        { ok: false, requestId, error: 'criteriaId inválido (uuid requerido)' },
        { status: 400 }
      )
    }

    const r = body.response

    // Validar SOLO lo presente
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

    const hasAsIs = r.as_is_level != null
    const hasToBe = r.to_be_level != null
    const hasImp = r.importance != null

    const gap = hasAsIs && hasToBe ? (r.to_be_level as number) - (r.as_is_level as number) : null
    const weighted_gap = gap != null && hasImp ? gap * (r.importance as number) : null
    const is_complete = hasAsIs && hasToBe && hasImp

    const notesTrimmed =
      typeof r.as_is_notes === 'string' ? r.as_is_notes.trim() : null

    const supabaseAdmin = getServiceClient()

    const upsertPayload = {
      assessment_id: assessmentId,
      criteria_id: criteriaId,

      // Core
      as_is_level: r.as_is_level ?? null,
      to_be_level: r.to_be_level ?? null,
      importance: r.importance ?? null,
      as_is_notes: notesTrimmed ? notesTrimmed : null,

      // Opcionales
      as_is_confidence: r.as_is_confidence ?? null,
      to_be_timeframe: r.to_be_timeframe ?? null,

      response_source: 'manual',
      reviewed_by_user: true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin
      .from('dts_responses')
      .upsert(upsertPayload, { onConflict: 'assessment_id,criteria_id' })
      .select('id, assessment_id, criteria_id, as_is_level, to_be_level, importance, updated_at')
      .single()

    if (error) {
      console.error('[dts/responses] ❌ Supabase upsert error', {
        requestId,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      })

      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: 'Supabase upsert failed',
          supabase: {
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
            code: (error as any).code,
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
    console.error('[dts/responses] ❌ Unexpected server error', e)

    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: 'Unexpected server error',
        message: e?.message || String(e),
      },
      { status: 500 }
    )
  }
}
