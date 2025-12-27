import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const requestId = crypto.randomUUID()

  try {
    const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
    const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Si faltan envs => KO inmediato
    if (!hasUrl || !hasService) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: 'Missing env vars',
          hasUrl,
          hasService,
        },
        { status: 500 }
      )
    }

    // Ping a Supabase (barato): lee 1 fila de una tabla pequeña que exista siempre
    const supabase = supabaseService()
    const { error } = await supabase.from('dts_dmm_versions').select('version_code').limit(1)

    if (error) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Supabase query failed', supabase: { message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      requestId,
      env: { hasUrl, hasService },
      supabase: { ok: true },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Unexpected error', message: e?.message || String(e) },
      { status: 500 }
    )
  }
}
