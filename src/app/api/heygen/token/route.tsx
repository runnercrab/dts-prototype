// src/app/api/heygen/token/route.ts

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'HEYGEN_API_KEY missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const r = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({}),
    });

    if (!r.ok) {
      let body: any = {};
      try { body = await r.json(); } catch {}
      return new Response(
        JSON.stringify({ error: 'create_token failed', body }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const raw = await r.json();

    // Compatibilidad: puede venir { token } o { data: { token } } u otras estructuras.
    const token =
      raw?.token ??
      (raw?.data && (raw.data.token ?? raw.data?.session?.token)) ??
      null;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No token in response', body: raw }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error', detail: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
