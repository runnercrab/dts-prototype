// src/app/api/chat/route.ts
// Endpoint minimalista y robusto para hablar con OpenAI usando fetch (sin librerías externas).
// Espera { messages: [{ role:'user'|'assistant'|'system', text:string }, ...] }
// Devuelve { reply: string }

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { reply: '(error) Falta OPENAI_API_KEY en .env.local' },
        { status: 500 }
      )
    }

    // Leemos el body una sola vez
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const incoming = Array.isArray(body?.messages) ? body.messages : []
    const messages = incoming.map((m: any) => ({
      role: m?.role ?? 'user',
      content: String(m?.text ?? ''),
    }))

    // Seguridad: si no hay nada que preguntar, devolvemos algo útil
    if (!messages.length) {
      return Response.json({ reply: '¿En qué te ayudo con tu diagnóstico DTS?' })
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',          // estable, rápido y económico
        temperature: 0.3,
        messages,
      }),
      // Opcional: timeout rudimentario con AbortController si lo necesitas
      // signal: AbortSignal.timeout(20000)  // Node 18.17+/20
    })

    const data = await r.json().catch(() => ({}))

    // Manejo de errores de OpenAI
    if (!r.ok) {
      const apiMsg =
        data?.error?.message ||
        `OpenAI ${r.status} ${r.statusText}`

      return Response.json(
        { reply: `(error) ${apiMsg}` },
        { status: 500 }
      )
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      '(sin respuesta)'

    return Response.json({ reply })
  } catch (e: any) {
    return Response.json(
      { reply: `(error) ${e?.message || 'Error desconocido'}` },
      { status: 500 }
    )
  }
}
