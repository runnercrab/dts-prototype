// src/app/api/dts/assessment/create/route.ts
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_PACKS = ['tmf_full_v5', 'tmf_mvp12_v1'] as const
type AllowedPack = (typeof ALLOWED_PACKS)[number]

function isAllowedPack(x: any): x is AllowedPack {
  return typeof x === 'string' && (ALLOWED_PACKS as readonly string[]).includes(x)
}

export async function POST(req: Request) {
  const requestId = `create_${Date.now()}_${Math.random().toString(16).slice(2)}`
  try {
    const supabase = supabaseService()

    const body = await req.json().catch(() => ({}))
    const packReceived = body?.pack

    // Si viene pack inválido -> 400 (estricto, sin defaults silenciosos)
    if (!isAllowedPack(packReceived)) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: `pack inválido: ${String(packReceived)}`,
          allowed: ALLOWED_PACKS,
          hint: 'Usa exactamente uno de los packs permitidos por el CHECK de la tabla.',
        },
        { status: 400 }
      )
    }

    const pack: AllowedPack = packReceived
    const now = new Date().toISOString()

    // Prueba de vida: esto debe aparecer en logs del server.
    console.log('✅ [assessment/create] requestId=', requestId, 'packReceived=', packReceived, 'packUsed=', pack)

    const insertPayload = {
      pack, // <- CLAVE
      status: 'draft',
      current_phase: 0,
      phase_0_completed: false,
      started_at: now,
      created_at: now,
      updated_at: now,
      is_demo: false,
    }

    const { data, error } = await supabase
      .from('dts_assessments')
      .insert(insertPayload)
      .select('id, pack, status, current_phase')
      .single()

    if (error) {
      // 🔥 Forense: devolvemos qué intentamos insertar
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: error.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: 'insert dts_assessments failed',
          packReceived,
          packUsed: pack,
          attemptedPayload: insertPayload,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      requestId,
      assessmentId: data.id,
      pack: data.pack,
      status: data.status,
      current_phase: data.current_phase,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: err?.message || 'Unknown error',
        hint: 'Unhandled server error in assessment/create',
      },
      { status: 500 }
    )
  }
}
