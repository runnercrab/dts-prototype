// src/app/api/dts/assessment/get/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    return NextResponse.json({
      ok: true,
      assessment: data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
