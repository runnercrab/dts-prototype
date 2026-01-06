// src/app/api/dts/assessment/onboarding/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)
}

function asTrimmedString(v: any): string {
  return typeof v === 'string' ? v.trim() : ''
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const assessmentId = asTrimmedString(body?.assessmentId)
    const onboardingData = body?.onboardingData ?? null

    if (!isUuid(assessmentId)) {
      return NextResponse.json({ ok: false, error: 'assessmentId inválido' }, { status: 400 })
    }
    if (!onboardingData || typeof onboardingData !== 'object') {
      return NextResponse.json({ ok: false, error: 'onboardingData inválido' }, { status: 400 })
    }

    // ✅ Campos mínimos obligatorios para motor
    const name = asTrimmedString(onboardingData?.name)
    const industry = asTrimmedString(onboardingData?.industry)
    const size = asTrimmedString(onboardingData?.size)
    const country = asTrimmedString(onboardingData?.country)

    if (!name || !industry || !size || !country) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Faltan campos obligatorios: name, industry, size, country',
          missing: {
            name: !name,
            industry: !industry,
            size: !size,
            country: !country,
          },
        },
        { status: 400 }
      )
    }

    const supabase = supabaseService()

    // 1) Traemos el assessment (para no updatear algo inexistente)
    const { data: existing, error: getErr } = await supabase
      .from('dts_assessments')
      .select('id, started_at, organization_id')
      .eq('id', assessmentId)
      .single()

    if (getErr || !existing?.id) {
      return NextResponse.json(
        { ok: false, error: getErr?.message || 'Assessment no encontrado' },
        { status: 404 }
      )
    }

    const nowIso = new Date().toISOString()

    // 2) Si ya hay organization_id => update organization
    //    Si no hay => insert organization y enlazarlo
    let organizationId: string | null = existing.organization_id ?? null

    if (organizationId) {
      const { error: orgUpdErr } = await supabase
        .from('dts_organizations')
        .update({
          name,
          industry,
          size,
          country,
          updated_at: nowIso,
        })
        .eq('id', organizationId)

      if (orgUpdErr) {
        return NextResponse.json(
          { ok: false, error: `Error actualizando organización: ${orgUpdErr.message}` },
          { status: 500 }
        )
      }
    } else {
      const { data: orgRow, error: orgInsErr } = await supabase
        .from('dts_organizations')
        .insert({
          name,
          industry,
          size,
          country,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: null, // MVP sin auth obligatoria
        })
        .select('id')
        .single()

      if (orgInsErr || !orgRow?.id) {
        return NextResponse.json(
          { ok: false, error: `Error creando organización: ${orgInsErr?.message || 'unknown'}` },
          { status: 500 }
        )
      }

      organizationId = orgRow.id
    }

    // 3) Guardamos onboarding_data + enlazamos organization_id + marcamos fase
    const patch: any = {
      organization_id: organizationId,
      onboarding_data: onboardingData,
      phase_0_completed: true,
      status: 'in-progress',
      updated_at: nowIso,
    }

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
      organizationId,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
