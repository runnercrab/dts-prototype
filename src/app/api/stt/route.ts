// src/app/api/stt/route.ts
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY missing' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Esperamos multipart/form-data con un campo "audio"
    const form = await req.formData();
    const file = form.get('audio') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No audio file (field: "audio")' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Construimos form-data para OpenAI Whisper
    const fd = new FormData();
    fd.append('file', file, (file as any).name || 'audio.webm');
    fd.append('model', 'whisper-1');          // STT robusto para prototipo
    fd.append('response_format', 'json');     // { text: "..." }
    // fd.append('language', 'es');           // opcional: fuerza idioma español

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: fd,
    });

    if (!r.ok) {
      let body: any = {};
      try { body = await r.json(); } catch {}
      return new Response(JSON.stringify({ error: 'Whisper failed', body }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await r.json(); // { text: "..." }
    const text = data?.text ?? '';
    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
