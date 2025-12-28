// src/app/api/dts/mvp12/criteria/route.ts
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

function orderByMvp12(codes: string[]) {
  const rank = new Map<string, number>()
  codes.forEach((c, idx) => rank.set(c, idx))
  return (a: any, b: any) => (rank.get(a.code) ?? 999) - (rank.get(b.code) ?? 999)
}

export async function GET() {
  try {
    const supabase = supabaseService()

    const { data, error } = await supabase
      .from('dts_criteria')
      .select(
        `
        id, code, description, description_es, short_label, short_label_es,
        context, context_es, focus_area, tier, subdimension_id, display_order,
        level_1_description_es, level_2_description_es, level_3_description_es,
        level_4_description_es, level_5_description_es,
        dts_subdimensions!inner (
          id, code, name, name_es, display_order,
          dts_dimensions!inner (id, code, name, name_es, display_order)
        )
      `
      )
      .in('code', MVP12_CODES as unknown as string[])

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: 'Supabase query error' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No se encontraron criterios MVP12 en dts_criteria' },
        { status: 404 }
      )
    }

    const transformed = data.map((c: any) => {
      const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions
      const dimension = subdimension?.dts_dimensions
      const dimensionArray = Array.isArray(dimension) ? dimension[0] : dimension

      const dimensionName = dimensionArray?.name || ''
      const dimensionNameEs = DIMENSION_NAME_MAP[dimensionName] || dimensionName

      return {
        id: c.id,
        code: c.code,
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
        level_1_description_es: c.level_1_description_es,
        level_2_description_es: c.level_2_description_es,
        level_3_description_es: c.level_3_description_es,
        level_4_description_es: c.level_4_description_es,
        level_5_description_es: c.level_5_description_es,
      }
    })

    transformed.sort(orderByMvp12([...MVP12_CODES]))

    const returnedCodes = new Set(transformed.map((x: any) => x.code))
    const missing = MVP12_CODES.filter(c => !returnedCodes.has(c))
    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Pack MVP12 incompleto en BD (faltan códigos)',
          missing,
          got: transformed.map((x: any) => x.code),
        },
        { status: 500 }
      )
    }

    const res = NextResponse.json({
      ok: true,
      pack: 'MVP12',
      criteria: transformed,
    })
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return res
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
