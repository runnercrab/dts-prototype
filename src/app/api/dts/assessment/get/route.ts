// src/app/api/dts/assessment/get/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Wave 0.A — whitelist outbound de onboarding_data.
// Solo estas keys se devuelven al cliente. Cualquier otra clave persistida
// en el jsonb se filtra antes de salir.
const ALLOWED_ONBOARDING_KEYS = new Set([
  'name',
  'companyName',
  'industry',
  'sector',
  'size',
  'companySize',
  'country',
  'role',
])

function sanitizeOnboardingData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const input = value as Record<string, unknown>
  const output: Record<string, unknown> = {}

  for (const key of ALLOWED_ONBOARDING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      output[key] = input[key]
    }
  }

  return Object.keys(output).length > 0 ? output : null
}

export async function GET(req: Request) {
  try {
    const supabase = supabaseService()
    const url = new URL(req.url)

    const assessmentId = url.searchParams.get('assessmentId')
    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: 'assessmentId requerido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('dts_assessments')
      .select('id, pack, status, onboarding_data, current_phase')
      .eq('id', assessmentId)
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 })
    }

    const assessment =
      data === null
        ? data
        : { ...data, onboarding_data: sanitizeOnboardingData(data.onboarding_data) }

    return NextResponse.json({
      ok: true,
      assessment,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
