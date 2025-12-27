import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function round2(n: number | null) {
  if (n == null || Number.isNaN(n)) return null
  return Math.round(n * 100) / 100
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()

  try {
    const { assessmentId, dimensionId } = (await req.json()) as {
      assessmentId?: string
      dimensionId?: string
    }

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: 'Missing assessmentId', requestId },
        { status: 400 }
      )
    }

    const supabase = supabaseService()

    const { data: dimAgg, error: dimAggErr } = await supabase.rpc(
      'dts_recalc_dimension_scores',
      {
        p_assessment_id: assessmentId,
        p_dimension_id: dimensionId ?? null,
      }
    )

    if (dimAggErr) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to aggregate dimension scores',
          requestId,
          supabase: { message: dimAggErr.message, code: (dimAggErr as any).code },
        },
        { status: 500 }
      )
    }

    const rows = (dimAgg ?? []) as Array<{
      dimension_id: string
      answered_count: number
      total_count: number
      as_is_avg: number | null
      to_be_avg: number | null
      gap_avg: number | null
      weighted_gap_avg: number | null
    }>

    if (rows.length > 0) {
      const payload = rows.map((r) => ({
        assessment_id: assessmentId,
        dimension_id: r.dimension_id,
        answered_count: r.answered_count,
        total_count: r.total_count,
        as_is_avg: round2(r.as_is_avg),
        to_be_avg: round2(r.to_be_avg),
        gap_avg: round2(r.gap_avg),
        weighted_gap_avg: round2(r.weighted_gap_avg),
        updated_at: new Date().toISOString(),
      }))

      const { error: upErr } = await supabase
        .from('dts_dimension_scores')
        .upsert(payload, { onConflict: 'assessment_id,dimension_id' })

      if (upErr) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to upsert dts_dimension_scores',
            requestId,
            supabase: { message: upErr.message, code: (upErr as any).code },
          },
          { status: 500 }
        )
      }
    }

    const { data: overall, error: overallErr } = await supabase.rpc(
      'dts_recalc_assessment_scores',
      { p_assessment_id: assessmentId }
    )

    if (overallErr) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to aggregate assessment score',
          requestId,
          supabase: { message: overallErr.message, code: (overallErr as any).code },
        },
        { status: 500 }
      )
    }

    const o = (overall?.[0] ?? null) as
      | {
          answered_count: number
          total_count: number
          as_is_avg: number | null
          to_be_avg: number | null
          gap_avg: number | null
          weighted_gap_avg: number | null
        }
      | null

    if (o) {
      const { error: upOverallErr } = await supabase
        .from('dts_assessment_scores')
        .upsert(
          {
            assessment_id: assessmentId,
            answered_count: o.answered_count,
            total_count: o.total_count,
            as_is_avg: round2(o.as_is_avg),
            to_be_avg: round2(o.to_be_avg),
            gap_avg: round2(o.gap_avg),
            weighted_gap_avg: round2(o.weighted_gap_avg),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'assessment_id' }
        )

      if (upOverallErr) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to upsert dts_assessment_scores',
            requestId,
            supabase: { message: upOverallErr.message, code: (upOverallErr as any).code },
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true, requestId, updatedDimensions: rows.length })
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unexpected server error',
        requestId,
        message: e?.message || String(e),
      },
      { status: 500 }
    )
  }
}
