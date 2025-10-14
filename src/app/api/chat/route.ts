export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const isTest = url.searchParams.get('test') === '1';

    // 🔒 Modo prueba: NO llama a OpenAI, valida tubería UI→API→avatar
    if (isTest) {
      return new Response(JSON.stringify({ reply: 'DTS-PIPE-OK' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing' }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control':'no-store' },
      });
    }

    const { message } = await req.json().catch(() => ({} as any));
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid "message"' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control':'no-store' },
      });
    }

    // 🧠 Sistema enfocado a DTS (nada de HeyGen)
    const systemPrompt = `
Eres el asistente del proyecto **DTS — Digital Transformation Score**.
- Respondes SIEMPRE en **español**, claro y conciso (2–5 frases).
- Te centras en diagnóstico y recomendaciones en 6 dimensiones: Estrategia, Procesos, Personas, Tecnología, Datos, Cliente.
- Si te preguntan por HeyGen/avatares/SDK, responde brevemente que no es el tema y reconduce a transformación digital/DTS.
- No inventes; si falta contexto, pide una aclaración breve.
    `.trim();

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!r.ok) {
      let body: any = {};
      try { body = await r.json(); } catch {}
      return new Response(JSON.stringify({ error: 'OpenAI failed', body }), {
        status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control':'no-store' },
      });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim?.() || 'No tengo respuesta ahora mismo.';
    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control':'no-store' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control':'no-store' },
    });
  }
}
