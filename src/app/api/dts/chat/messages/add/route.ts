import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type Body = {
  assessmentId: string
  criteriaId: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>

    const assessmentId = body.assessmentId
    const criteriaId = body.criteriaId
    const role = body.role
    const content = body.content

    if (!assessmentId || !criteriaId || !role || !content) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: assessmentId, criteriaId, role, content' },
        { status: 400 }
      )
    }

    const supabase = getAdminSupabase()
    const table = process.env.DTS_CHAT_MESSAGES_TABLE || 'dts_chat_messages'

    const { data, error } = await supabase
      .from(table)
      .insert({
        assessment_id: assessmentId,
        criteria_id: criteriaId,
        role,
        content,
      })
      .select('id, created_at')
      .single()

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Supabase error inserting into ${table}`, details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: {
        id: (data as any)?.id ?? null,
        created_at: (data as any)?.created_at ?? null,
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'Unhandled error in /api/dts/chat/messages/add', details: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}
