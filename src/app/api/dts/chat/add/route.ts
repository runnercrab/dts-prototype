import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = supabaseService()
    const body = await req.json()

    const assessmentId = body?.assessmentId as string | undefined
    const criteriaId = body?.criteriaId as string | undefined
    const role = body?.role as 'user' | 'assistant' | 'system' | undefined
    const content = body?.content as string | undefined

    if (!assessmentId) return NextResponse.json({ ok: false, error: 'assessmentId requerido' }, { status: 400 })
    if (!criteriaId) return NextResponse.json({ ok: false, error: 'criteriaId requerido' }, { status: 400 })
    if (!role) return NextResponse.json({ ok: false, error: 'role requerido' }, { status: 400 })
    if (!content) return NextResponse.json({ ok: false, error: 'content requerido' }, { status: 400 })

    const { error } = await supabase.from('dts_chat_messages').insert({
      assessment_id: assessmentId,
      criteria_id: criteriaId,
      role,
      content,
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
