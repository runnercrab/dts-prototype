// src/app/api/heygen/voices/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type Voice = {
  id?: string;
  name?: string;
  language?: string;   // "es", "en", ...
  locale?: string;     // "es-ES", "es-MX" (no siempre)
  support_interactive_avatar?: boolean;
  supports_interactive_avatar?: boolean; // por si viniera con 's'
  [k: string]: any;
};

function supportsInteractive(v: Voice) {
  return Boolean(v.support_interactive_avatar || v.supports_interactive_avatar);
}
function isSpanish(v: Voice) {
  const lang = (v.language || '').toLowerCase();
  const loc  = (v.locale   || '').toLowerCase();
  const name = (v.name || '').toLowerCase();
  return lang.startsWith('es') || loc.startsWith('es') || name.includes('spanish');
}

export async function GET(req: Request) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return new Response('Missing HEYGEN_API_KEY', { status: 500 });
  }

  const url = new URL(req.url);
  const allParam = url.searchParams.get('all') === '1';

  const r = await fetch('https://api.heygen.com/v2/voices', {
    headers: {
      'x-api-key': apiKey,
      'accept': 'application/json',
    },
    cache: 'no-store',
  });

  const status = r.status;
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    return new Response(JSON.stringify({ error: text || `status ${status}` }), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  const data = await r.json().catch(() => null);
  const all: Voice[] = Array.isArray(data?.data) ? data.data : [];

  const esAll = all.filter(isSpanish);
  const esInteractive = esAll.filter(supportsInteractive);

  esInteractive.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  const body: any = {
    meta: {
      http_status: status,
      total: all.length,
      total_es: esAll.length,
      total_es_interactive: esInteractive.length,
    },
    voices: esInteractive, // solo españolas y con soporte interactive
  };

  if (allParam) body.all = all; // diagnóstico opcional

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
