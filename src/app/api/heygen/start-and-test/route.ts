// Axios-based: crea new_session y devuelve { url, access_token }. GET sencillo.
// .env.local -> HEYGEN_API_KEY=sk-xxxx

import axios from 'axios'
export const dynamic = 'force-dynamic'

type AnyObj = Record<string, any>

const BASES = [
  { name: 'global', url: 'https://api.heygen.com' },
  { name: 'eu',     url: 'https://eu-api.heygen.com' },
] as const

const PATHS = [
  { name: 'dot_new_session',   path: '/v1/streaming.new_session' },
  { name: 'slash_new_session', path: '/v1/streaming/new_session' },
]

function getKey(): string {
  const k = process.env.HEYGEN_API_KEY
  if (!k) throw new Error('Missing HEYGEN_API_KEY in .env.local')
  return k
}

function pick<T>(...vals: (T | undefined | null)[]): T | null {
  for (const v of vals) if (v != null) return v as T
  return null
}

async function tryNewSession(baseUrl: string, key: string, payload: AnyObj = {}) {
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  for (const p of PATHS) {
    const url = `${baseUrl}${p.path}`
    try {
      const res = await axios.post(url, payload, { headers, timeout: 15000, validateStatus: () => true })
      const { status, data } = res

      if (status >= 200 && status < 300) {
        const lkUrl = pick(data?.url, data?.livekit_url, data?.livekit?.url, data?.data?.url, data?.data?.livekit_url)
        const token = pick(data?.access_token, data?.token, data?.livekit?.access_token, data?.data?.access_token)
        const session_id = pick(data?.session_id, data?.data?.session_id)
        return { ok: true, endpointUsed: url, session_id, url: lkUrl, access_token: token, raw: data }
      } else {
        return { ok: false, endpointUsed: url, status, body: data }
      }
    } catch (e: any) {
      return {
        ok: false,
        endpointUsed: url,
        status: 'AXIOS_ERROR',
        error: e?.message,
        code: e?.code,
        cause: e?.cause?.message,
      }
    }
  }
  return { ok: false, endpointUsed: `${baseUrl}(no-path-tried)`, status: 'NO_PATH' }
}

export async function GET() {
  try {
    const key = getKey()
    const results: any[] = []
    for (const b of BASES) {
      const r = await tryNewSession(b.url, key, {})
      results.push({ base: b.name, ...r })
    }

    const success = results.find(r => r.ok && r.url && r.access_token)
    if (success) {
      return Response.json({
        note: 'Paste url + access_token into https://livekit.io/connection-test',
        baseUsed: success.base,
        endpointUsed: success.endpointUsed,
        session_id: success.session_id,
        url: success.url,
        access_token: success.access_token,
        alsoTried: results,
      })
    }
    return Response.json({ error: 'new_session failed on all attempts (axios)', attempts: results }, { status: 502 })
  } catch (e:any) {
    return Response.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
