// src/app/api/dts/chat/save/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = supabaseService()
    const body = await req.json()

    const assessmentId = body?.assessmentId
    const criteriaId = body?.criteriaId
    const role = body?.role
    const content = body?.content

    if (!assessmentId || !criteriaId || !role || !content) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabase.from('dts_chat_messages').insert({
      assessment_id: assessmentId,
      criteria_id: criteriaId,
      role,
      content,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
