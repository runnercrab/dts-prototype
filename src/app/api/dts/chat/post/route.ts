// src/app/api/dts/chat/post/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { assessmentId, criteriaId, role, content } = body || {}

    if (!assessmentId) return NextResponse.json({ ok: false, error: 'assessmentId requerido' }, { status: 400 })
    if (!criteriaId) return NextResponse.json({ ok: false, error: 'criteriaId requerido' }, { status: 400 })
    if (!role) return NextResponse.json({ ok: false, error: 'role requerido' }, { status: 400 })
    if (!content) return NextResponse.json({ ok: false, error: 'content requerido' }, { status: 400 })

    const supabase = supabaseService()

    const { error } = await supabase.from('dts_chat_messages').insert({
      assessment_id: assessmentId,
      criteria_id: criteriaId,
      role,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
