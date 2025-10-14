// src/app/api/tts/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type TtsReq = {
  text: string;
  voiceId?: string;   // opcional; si no viene, usa ELEVENLABS_VOICE_ID del server
  model?: string;     // opcional; p.ej. "eleven_turbo_v2"
};

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const defaultVoice = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey) {
    return new Response('Missing ELEVENLABS_API_KEY', { status: 500 });
  }

  let body: TtsReq;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const text = (body?.text || '').trim();
  const voiceId = (body?.voiceId || defaultVoice || '').trim();
  if (!text) return new Response('Missing text', { status: 400 });
  if (!voiceId) return new Response('Missing voiceId', { status: 400 });

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const payload = {
    text,
    model_id: body?.model || 'eleven_turbo_v2',
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.8,
      style: 0.35,
      use_speaker_boost: true,
    },
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'content-type': 'application/json',
      'accept': 'audio/mpeg',
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    return new Response(`TTS error ${r.status}: ${txt}`, {
      status: r.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const audioBuf = await r.arrayBuffer();
  return new Response(audioBuf, {
    status: 200,
    headers: {
      'content-type': 'audio/mpeg',
      'cache-control': 'no-store',
    },
  });
}
