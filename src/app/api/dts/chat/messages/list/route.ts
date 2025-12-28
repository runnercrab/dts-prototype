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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = searchParams.get('assessmentId')
    const criteriaId = searchParams.get('criteriaId')

    if (!assessmentId || !criteriaId) {
      return NextResponse.json({ ok: false, error: 'Missing assessmentId or criteriaId' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const table = process.env.DTS_CHAT_MESSAGES_TABLE || 'dts_chat_messages'

    const { data, error } = await supabase
      .from(table)
      .select('role, content, created_at')
      .eq('assessment_id', assessmentId)
      .eq('criteria_id', criteriaId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Supabase error reading ${table}`, details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      assessmentId,
      criteriaId,
      count: (data ?? []).length,
      messages: data ?? [],
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'Unhandled error in /api/dts/chat/messages/list', details: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}
