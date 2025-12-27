import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Body = {
  assessmentId: string
  criteriaId: string
  response: {
    as_is_level: number
    as_is_confidence: 'low' | 'medium' | 'high'
    as_is_notes?: string | null
    to_be_level: number
    to_be_timeframe: '6months' | '1year' | '2years' | '3years+'
    importance: number
  }
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('Missing env: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!body?.assessmentId || !body?.criteriaId || !body?.response) {
      return NextResponse.json(
        { ok: false, error: 'Missing assessmentId / criteriaId / response' },
        { status: 400 }
      )
    }

    const r = body.response
    const missing =
      r.as_is_level == null ||
      r.as_is_confidence == null ||
      r.to_be_level == null ||
      r.to_be_timeframe == null ||
      r.importance == null

    if (missing) {
      return NextResponse.json(
        { ok: false, error: 'Incomplete response payload' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getServiceClient()

    const { error } = await supabaseAdmin
      .from('dts_responses')
      .upsert(
        {
          assessment_id: body.assessmentId,
          criteria_id: body.criteriaId, // ✅ CONFIRMADO
          as_is_level: r.as_is_level,
          as_is_confidence: r.as_is_confidence,
          as_is_notes: r.as_is_notes ?? null,
          to_be_level: r.to_be_level,
          to_be_timeframe: r.to_be_timeframe,
          importance: r.importance,
          response_source: 'manual',
          reviewed_by_user: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'assessment_id,criteria_id',
        }
      )

    if (error) {
      console.error('[dts/responses] ❌ Supabase upsert error', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      })

      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase upsert failed',
          supabase: {
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
            code: (error as any).code,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[dts/responses] ❌ Unexpected server error', e)

    return NextResponse.json(
      {
        ok: false,
        error: 'Unexpected server error',
        message: e?.message || String(e),
      },
      { status: 500 }
    )
  }
}
