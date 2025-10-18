// src/app/api/chat/route.ts
// Endpoint minimalista y robusto para hablar con OpenAI usando fetch (sin librerías externas).
// Espera { message: string } o { messages: [{ role, text }, ...] }
// Devuelve { reply: string }

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Eres un asesor digital especializado en transformación digital para PYMEs.

Tu objetivo es ayudar a las empresas a evaluar y mejorar su madurez digital en 6 dimensiones:
1. Estrategia - Visión, planes y medición de la transformación digital
2. Cliente - Experiencia digital del cliente y canales de interacción
3. Procesos - Automatización, digitalización y eficiencia operativa
4. Datos - Gestión, análisis y uso estratégico de datos
5. Tecnología - Infraestructura, cloud, ciberseguridad y herramientas digitales
6. Personas - Talento digital, cultura y capacidades del equipo

Estilo de comunicación:
- Respuestas directas de 2-3 oraciones (máximo 50 palabras)
- Tono profesional pero cercano
- Da valor práctico sin rodeos
- Si preguntan fuera del ámbito DTS, redirige amablemente
- Lenguaje claro, sin tecnicismos innecesarios

CRÍTICO: Conversación de voz - sé breve y directo. El usuario valora la concisión.`

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { reply: 'Error de configuración. Contacta con soporte.' },
        { status: 500 }
      )
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    // Soportar dos formatos: { message: string } o { messages: [...] }
    let messages: Array<{ role: string; content: string }> = []

    if (body.message && typeof body.message === 'string') {
      // Formato simple: un solo mensaje del usuario
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.message.trim() }
      ]
    } else if (Array.isArray(body.messages)) {
      // Formato con historial de conversación
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...body.messages.map((m: any) => ({
          role: m?.role ?? 'user',
          content: String(m?.text ?? '').trim(),
        }))
      ]
    } else {
      // Sin mensaje válido
      return Response.json({ 
        reply: '¿En qué te puedo ayudar con tu diagnóstico DTS?' 
      })
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 150, // ✅ Limitar respuesta para controlar costos y que sea concisa
        messages,
      }),
    })

    const data = await r.json().catch(() => ({}))

    if (!r.ok) {
      const apiMsg = data?.error?.message || `OpenAI ${r.status} ${r.statusText}`
      console.error('OpenAI API error:', apiMsg)
      return Response.json(
        { reply: 'Disculpa, hubo un error. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || 
                  '¿Puedes repetir la pregunta?'

    return Response.json({ reply })
  } catch (e: any) {
    console.error('Chat API error:', e)
    return Response.json(
      { reply: 'Error al procesar tu mensaje. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}