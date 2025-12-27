import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // <- CLAVE

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function GET(req: Request) {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json({ ok: false, error: 'Missing assessmentId', requestId }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: assessmentScore, error: aErr } = await supabase
      .from('dts_assessment_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (aErr) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch assessment score', requestId, supabase: { message: aErr.message, code: (aErr as any).code } },
        { status: 500 }
      )
    }

    const { data: dimensionScores, error: dErr } = await supabase
      .from('dts_dimension_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('updated_at', { ascending: false })

    if (dErr) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch dimension scores', requestId, supabase: { message: dErr.message, code: (dErr as any).code } },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, requestId, assessmentScore: assessmentScore ?? null, dimensionScores: dimensionScores ?? [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'Unexpected server error', requestId, message: e?.message || String(e) }, { status: 500 })
  }
}
