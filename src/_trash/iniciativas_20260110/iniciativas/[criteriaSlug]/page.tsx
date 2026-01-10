import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type InitiativeVM = {
  id: string;
  title: string;
  description: string;
  what_changes: string;
  category: string;
  effort: "Bajo" | "Medio" | "Alto";
  helps: string[];
};

type CapabilityVM = {
  id: string;
  title: string;
  type?: string;
  description?: string;
};

type InitiativesVM = {
  criteria: { code: string; title: string; title_en: string };
  as_is: { level: number; text: string };
  to_be: { level: number; text: string };
  freno: { text: string };
  capabilities: CapabilityVM[];
  initiatives: InitiativeVM[];
  ui: { disclaimer: string };
};

// ✅ baseUrl robusto: en dev puede faltar host según cómo entres
function absBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (host) return `${proto}://${host}`;

  // fallback ultra explícito
  return "http://localhost:3000";
}

async function getData(assessmentId: string, criteriaCode: string) {
  const base = absBaseUrl();

  const url = `${base}/api/dts/results/iniciativas?assessmentId=${encodeURIComponent(
    assessmentId
  )}&criteriaCode=${encodeURIComponent(criteriaCode)}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { ok: false as const, status: res.status, body: txt };
  }

  const json = (await res.json()) as InitiativesVM;
  return { ok: true as const, data: json };
}

function EffortPill({ effort }: { effort: "Bajo" | "Medio" | "Alto" }) {
  return (
    <span className="text-xs rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-700">
      Esfuerzo estimado: {effort}
    </span>
  );
}

export default async function IniciativasByCriterioPage({
  params,
}: {
  params: { assessmentId?: string; criteriaSlug?: string };
}) {
  const assessmentId = (params?.assessmentId ?? "").toString().trim();
  const criteriaSlug = (params?.criteriaSlug ?? "").toString().trim();

  if (!assessmentId || !criteriaSlug) return notFound();

  // ✅ slug -> code: 1-1-1 -> 1.1.1
  const criteriaCode = decodeURIComponent(criteriaSlug).replaceAll("-", ".");

  const res = await getData(assessmentId, criteriaCode);

  // ✅ Si el endpoint falla, NO 404 silencioso: mostramos por qué
  if (!res.ok) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            No pude cargar iniciativas para <b>{criteriaCode}</b>.
            <div className="mt-2 text-sm text-rose-800">
              API status: {res.status}
            </div>
            {res.body ? (
              <pre className="mt-3 whitespace-pre-wrap text-xs text-rose-900">
                {res.body}
              </pre>
            ) : null}
          </div>

          <Link
            href={`/resultados/${assessmentId}/iniciativas`}
            className="text-sm text-slate-700 underline"
          >
            Volver a la lista
          </Link>
        </div>
      </main>
    );
  }

  const data = res.data;

  const hasFreno = Boolean(data.freno?.text?.trim());
  const hasCaps = (data.capabilities || []).length > 0;
  const hasInits = (data.initiatives || []).length > 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/resultados/${assessmentId}/iniciativas`}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Volver
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href={`/resultados/${assessmentId}`}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Resultado Ejecutivo
              </Link>
            </div>

            <div className="flex-1 text-center">
              <div className="text-lg sm:text-xl font-semibold text-slate-900">
                Opciones para mejorar
              </div>
              <div className="text-xs sm:text-sm text-slate-600">
                Te mostramos distintas formas de avanzar. Aquí no se decide todavía.
              </div>
            </div>

            <button
              disabled
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium"
              title="Disponible cuando comparemos iniciativas"
            >
              Comparar iniciativas
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">CRITERIO</div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-700">
              {data.criteria.code}
            </span>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">
              {data.criteria.title || data.criteria.title_en || data.criteria.code}
            </h1>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500">
              Situación actual · Nivel {data.as_is.level || "—"}
            </div>
            <div className="mt-2 text-sm text-slate-900">{data.as_is.text || "—"}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500">
              Objetivo · Nivel {data.to_be.level || "—"}
            </div>
            <div className="mt-2 text-sm text-slate-900">{data.to_be.text || "—"}</div>
          </section>
        </div>

        {hasFreno ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500">Freno principal</div>
            <div className="mt-2 text-sm text-slate-900">❗ {data.freno.text}</div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Qué debería saber hacer la empresa (capacidades)
          </h2>
          {hasCaps ? (
            <ul className="mt-4 space-y-2">
              {data.capabilities.map((c) => (
                <li key={c.id} className="text-sm text-slate-900">
                  ☐ <span className="font-semibold">{c.title}</span>
                  {c.type ? <span className="text-slate-500"> · {c.type}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Aún no hay capacidades definidas para este criterio.
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Opciones para mejorar (iniciativas)
          </h2>

          {hasInits ? (
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              {data.initiatives.map((i) => (
                <article
                  key={i.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">INICIATIVA</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {i.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Tipo: {i.category || "—"}
                      </div>
                    </div>
                    <EffortPill effort={i.effort} />
                  </div>

                  <div className="text-sm text-slate-800">{i.description || "—"}</div>

                  {i.what_changes?.trim() ? (
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">
                        Qué cambia respecto a hoy:{" "}
                      </span>
                      {i.what_changes}
                    </div>
                  ) : null}

                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">
                      Capacidades que refuerza
                    </div>
                    {i.helps?.length ? (
                      <ul className="list-disc ml-5 mt-1 text-slate-800">
                        {i.helps.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-1 text-xs text-slate-500">
                        (Aún no hay relación iniciativa → capacidades)
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Aún no hay iniciativas definidas para este criterio.
            </div>
          )}
        </section>

        <div className="text-sm text-slate-500">
          {data.ui?.disclaimer?.trim()
            ? data.ui.disclaimer
            : "No hay una opción “correcta”. Aquí solo ves opciones comparables."}
        </div>
      </div>
    </main>
  );
}
