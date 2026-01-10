//src/app/api/dts/score/get/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: 'Missing assessmentId', requestId },
        { status: 400 }
      )
    }

    const supabase = supabaseService()

    // pack source-of-truth
    const { data: assessment, error: asErr } = await supabase
      .from('dts_assessments')
      .select('id, pack')
      .eq('id', assessmentId)
      .single()

    if (asErr || !assessment) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Assessment not found',
          requestId,
          supabase: { message: asErr?.message, code: (asErr as any)?.code },
        },
        { status: 404 }
      )
    }

    const { count: criteriaTotalInPack, error: pErr } = await supabase
      .from('dts_pack_criteria')
      .select('*', { count: 'exact', head: true })
      .eq('pack', assessment.pack)

    if (pErr) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to resolve pack criteria',
          requestId,
          supabase: { message: pErr.message, code: (pErr as any).code },
        },
        { status: 500 }
      )
    }

    // pack no mapeado => no inventar 129
    if (!criteriaTotalInPack || criteriaTotalInPack === 0) {
      return NextResponse.json({
        ok: true,
        requestId,
        assessmentScore: null,
        dimensionScores: [],
      })
    }

    const { data: assessmentScore, error: aErr } = await supabase
      .from('dts_assessment_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (aErr) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch assessment score',
          requestId,
          supabase: { message: aErr.message, code: (aErr as any).code },
        },
        { status: 500 }
      )
    }

    // score fuera de sync => UI forzará recalc
    if (!assessmentScore || assessmentScore.total_count !== criteriaTotalInPack) {
      return NextResponse.json({
        ok: true,
        requestId,
        assessmentScore: null,
        dimensionScores: [],
      })
    }

    const { data: dimensionScores, error: dErr } = await supabase
      .from('dts_dimension_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('updated_at', { ascending: false })

    if (dErr) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch dimension scores',
          requestId,
          supabase: { message: dErr.message, code: (dErr as any).code },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      requestId,
      assessmentScore: assessmentScore ?? null,
      dimensionScores: dimensionScores ?? [],
    })
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
