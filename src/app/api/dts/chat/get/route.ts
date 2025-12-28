// src/app/api/dts/chat/get/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const assessmentId = url.searchParams.get('assessmentId')
    const criteriaId = url.searchParams.get('criteriaId')

    if (!assessmentId) return NextResponse.json({ ok: false, error: 'assessmentId requerido' }, { status: 400 })
    if (!criteriaId) return NextResponse.json({ ok: false, error: 'criteriaId requerido' }, { status: 400 })

    const supabase = supabaseService()

    const { data, error } = await supabase
      .from('dts_chat_messages')
      .select('id, role, content, created_at')
      .eq('assessment_id', assessmentId)
      .eq('criteria_id', criteriaId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, messages: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
