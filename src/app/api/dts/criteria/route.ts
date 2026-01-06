// src/app/api/dts/criteria/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MVP12_CODES = [
  '1.1.1',
  '1.1.2',
  '2.1.3',
  '2.5.4',
  '3.1.1',
  '3.4.1',
  '4.1.1',
  '4.2.2',
  '5.1.1',
  '5.5.1',
  '6.1.1',
  '6.2.1',
] as const

const DIMENSION_NAME_MAP: Record<string, string> = {
  Customer: 'Cliente',
  Strategy: 'Estrategia',
  Technology: 'Tecnología',
  Operations: 'Operaciones',
  Culture: 'Cultura',
  Data: 'Datos',
}

function orderByList(order: readonly string[]) {
  const rank = new Map<string, number>()
  order.forEach((c, idx) => rank.set(c, idx))
  return (a: any, b: any) => (rank.get(a.code) ?? 999) - (rank.get(b.code) ?? 999)
}

function jsonError(status: number, payload: any) {
  return NextResponse.json({ ok: false, ...payload }, { status })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return jsonError(400, { error: 'assessmentId is required' })
    }

    const supabase = supabaseService()

    // 1) Leer pack del assessment
    const { data: assessment, error: aErr } = await supabase
      .from('dts_assessments')
      .select('id, pack')
      .eq('id', assessmentId)
      .single()

    if (aErr || !assessment) {
      return jsonError(404, { error: 'assessment not found', details: aErr?.message })
    }

    const pack = assessment.pack as string

    // 2) Query criterios según pack
    let criteriaQuery = supabase
      .from('dts_criteria')
      .select(
        `
        id, code, description, description_es, short_label, short_label_es,
        context, context_es, focus_area, tier, subdimension_id, display_order,
        level_1_description_es, level_2_description_es, level_3_description_es,
        level_4_description_es, level_5_description_es,
        explain_json,
        dts_subdimensions!inner (
          id, code, name, name_es, display_order,
          dts_dimensions!inner (id, code, name, name_es, display_order)
        )
      `
      )

    if (pack === 'mvp12_v1') {
      criteriaQuery = criteriaQuery.in('code', MVP12_CODES as unknown as string[])
    } else {
      criteriaQuery = criteriaQuery.in('tier', ['tier1', 'tier2'])
    }

    const { data, error } = await criteriaQuery

    if (error) return jsonError(500, { error: error.message, hint: 'Supabase query error' })
    if (!data || data.length === 0) return jsonError(404, { error: 'No criteria found for pack', pack })

    // 3) Transformación
    const transformed = data.map((c: any) => {
      const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions
      const dimension = subdimension?.dts_dimensions
      const dimensionArray = Array.isArray(dimension) ? dimension[0] : dimension

      const dimensionName = dimensionArray?.name || ''
      const dimensionNameEs = DIMENSION_NAME_MAP[dimensionName] || dimensionName

      return {
        id: c.id,
        code: c.code,

        // UX short fields
        description: c.description_es || c.description || '',
        short_label: c.short_label_es || c.short_label || '',
        context: c.context_es || c.context || null,

        focus_area: c.focus_area || '',
        subdimension_id: c.subdimension_id,

        subdimension: subdimension
          ? {
              name: subdimension.name_es || subdimension.name || '',
              code: subdimension.code || '',
              dimension_name: dimensionNameEs,
              dimension_display_order: dimensionArray?.display_order || 0,
              subdimension_display_order: subdimension.display_order || 0,
            }
          : undefined,

        dimension: dimensionArray
          ? {
              name: dimensionNameEs,
              code: dimensionArray.code || '',
              display_order: dimensionArray.display_order || 0,
            }
          : undefined,

        // Level texts (ES)
        level_1_description_es: c.level_1_description_es,
        level_2_description_es: c.level_2_description_es,
        level_3_description_es: c.level_3_description_es,
        level_4_description_es: c.level_4_description_es,
        level_5_description_es: c.level_5_description_es,

        // ✅ The CEO-model JSON
        explain_json: c.explain_json ?? null,
      }
    })

    // 4) Orden estable
    if (pack === 'mvp12_v1') {
      transformed.sort(orderByList(MVP12_CODES))
      const returned = new Set(transformed.map((x: any) => x.code))
      const missing = MVP12_CODES.filter((c) => !returned.has(c))
      if (missing.length) {
        return jsonError(500, {
          error: 'Pack MVP12 incompleto en BD (faltan códigos)',
          pack,
          missing,
          got: transformed.map((x: any) => x.code),
        })
      }
    } else {
      transformed.sort((a: any, b: any) => {
        const parse = (code: string) => code.split('.').map((p: string) => parseInt(p) || 0)
        const A = parse(a.code)
        const B = parse(b.code)
        for (let i = 0; i < Math.max(A.length, B.length); i++) {
          const x = A[i] || 0
          const y = B[i] || 0
          if (x !== y) return x - y
        }
        return 0
      })
    }

    return NextResponse.json({
      ok: true,
      assessmentId,
      pack,
      criteria: transformed,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
