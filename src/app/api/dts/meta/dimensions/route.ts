import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const requestId = crypto.randomUUID()

  try {
    const supabase = supabaseService()

    // Ajusta los nombres de columnas si tu tabla difiere.
    // Aquí asumo: id, code, name, display_order
    const { data, error } = await supabase
      .from('dts_dimensions')
      .select('id, code, name, display_order')
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to fetch dimensions meta',
          requestId,
          supabase: { message: error.message, code: (error as any).code },
        },
        { status: 500 }
      )
    }

    const items =
      (data ?? []).map((d: any) => ({
        dimension_id: d.id,
        dimension_code: d.code,
        dimension_name: d.name,
      })) ?? []

    return NextResponse.json({ ok: true, requestId, items })
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
