// src/app/api/heygen/new-session/route.ts
// Crea una sesión en HeyGen y extrae { url, access_token } para probar en LiveKit.
// Usa .env.local -> HEYGEN_API_KEY=sk-xxxx  (NO expongas la key en cliente)

import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'

type NewSessionBody = Record<string, any>

const BASES = {
  global: 'https://api.heygen.com',
  eu: 'https://eu-api.heygen.com',
} as const

const PATHS = [
  '/v1/streaming.new_session',      // estilo "dot"
  '/v1/streaming/new_session',      // estilo "slash"
]

function getKey(): string {
  const k = process.env.HEYGEN_API_KEY
  if (!k) throw new Error('Missing HEYGEN_API_KEY in .env.local')
  return k
}

async function tryEndpoints(
  baseUrl: string,
  key: string,
  payload: NewSessionBody
) {
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  for (const path of PATHS) {
    const url = `${baseUrl}${path}`
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {}),
    })

    let data: any = null
    try {
      data = await r.json()
    } catch {
      // si no es JSON, dejamos el body como texto
      data = { nonJsonBody: await r.text() }
    }

    if (r.ok) {
      // intentamos extraer url + access_token de distintas formas habituales
      const lkUrl =
        data?.url ||
        data?.livekit_url ||
        data?.livekit?.url ||
        data?.data?.url ||
        data?.data?.livekit_url

      const token =
        data?.access_token ||
        data?.token ||
        data?.livekit?.access_token ||
        data?.data?.access_token

      return {
        ok: true,
        endpointUsed: url,
        raw: data,
        url: lkUrl || null,
        access_token: token || null,
      }
    }

    // no ok: registramos intento fallido
  }

  return { ok: false, error: 'All new_session endpoints returned non-OK' }
}

export async function POST(req: NextRequest) {
  try {
    const key = getKey()
    const body = (await req.json().catch(() => ({}))) as NewSessionBody

    // Puedes forzar región con ?base=eu | global (por defecto global)
    const { searchParams } = new URL(req.url)
    const baseParam = (searchParams.get('base') || 'global') as 'global' | 'eu'
    const baseUrl = BASES[baseParam] || BASES.global

    const result = await tryEndpoints(baseUrl, key, body)

    if (!result.ok) {
      return Response.json(
        {
          error: 'new_session failed',
          hint: 'Try the other region with ?base=eu or validate payload',
        },
        { status: 502 }
      )
    }

    // Devolvemos lo mínimo para LiveKit Connection Test
    return Response.json({
      baseUsed: baseUrl,
      endpointUsed: result.endpointUsed,
      url: result.url,
      access_token: result.access_token,
      raw: result.raw, // útil para depurar si hiciera falta
    })
  } catch (e: any) {
    return Response.json(
      { error: e?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
