// src/app/api/dts/assessment/complete/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = supabaseService()
    const body = await req.json()
    const assessmentId = body?.assessmentId

    if (!assessmentId) {
      return NextResponse.json({ ok: false, error: 'assessmentId requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('dts_assessments')
      .update({
        status: 'completed',
        phase_2_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
