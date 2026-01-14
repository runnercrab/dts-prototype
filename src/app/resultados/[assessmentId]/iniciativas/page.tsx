// src/app/resultados/[assessmentId]/iniciativas/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type TopContributor = {
  criteria_code: string;
  title: string;
  gap: number;
  importance: number;
  map_weight: number;
  pack_weight: number;
  need_component: number;
};

type ProgramItem = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;
  status: string | null;
  impact_score: number;
  effort_score: number;
  weighted_need: number;
  value_score: number;
  program_score: number;
  criteria_covered: number;
  notes: string | null;
  owner: string | null;
  priority_badge: string; // "🟢 TOP" | "🟡 MEDIA" ...
  priority_reason: string;
  top_contributors: TopContributor[];
  top_contributors_need: number;
  top_contributors_share: number; // ya viene en % (ej 90.5)
  top_contributors_count: number;
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  thresholds: { top: number; mid_end: number };
  count: number;
  items: ProgramItem[];
};

export default function ProgramasPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(
    () => (params?.assessmentId || "").toString().trim(),
    [params]
  );
  const valid = assessmentId && isUuid(assessmentId);

  const hrefResultados = valid ? `/resultados/${assessmentId}` : `/resultados`;
  const hrefCierre = valid ? `/resultados/${assessmentId}/cierre` : `/resultados`;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    if (!valid) return;

    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);

        // ✅ contrato canónico
        const url = `/api/dts/results/programs?assessmentId=${assessmentId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as ApiResponse | { error: string };

        if (!res.ok) {
          const msg = (json as any)?.error || "Error cargando programas";
          throw new Error(msg);
        }

        if (!cancelled) setData(json as ApiResponse);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, valid]);

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            assessmentId inválido.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(hrefCierre)}
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            title="Volver al cierre"
          >
            ← Volver
          </button>

          <div className="text-sm text-slate-500">Programas recomendados</div>

          <button
            onClick={() => router.push(hrefResultados)}
            className="text-sm text-slate-600 hover:text-slate-900"
            title="Volver a Resultados"
          >
            Resultados
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="text-2xl font-semibold text-slate-900">
            Programas priorizados — qué hacer primero
          </div>

          <div className="mt-3 text-slate-700 leading-relaxed">
            Esto no son tareas sueltas. Son <b>programas</b> (macro) que agrupan
            áreas del diagnóstico. Más adelante, dentro de cada programa,
            desplegaremos <b>acciones</b> (micro) para ejecutar.
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-800">
            <div className="text-sm font-semibold">Cómo leer esto</div>
            <div className="mt-1 text-sm">
              En cada programa verás los <b>Top contributors</b>: criterios que
              explican la mayor parte del Need.
            </div>
          </div>

          {loading && <div className="mt-6 text-sm text-slate-600">Cargando…</div>}

          {err && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 text-sm">
              {err}
            </div>
          )}

          {!loading && !err && data && (
            <div className="mt-8 space-y-4">
              {data.items.map((p) => (
                <div
                  key={p.program_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-500">
                        #{p.rank} · {p.program_code} ·{" "}
                        <span className="font-semibold">{p.priority_badge}</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {p.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        {p.priority_reason}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Score</div>
                      <div className="text-2xl font-semibold text-slate-900">
                        {Math.round(p.program_score * 10) / 10}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Need {p.weighted_need} · Impact {p.impact_score} · Effort{" "}
                        {p.effort_score}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="text-sm font-semibold">
                      Estos {p.top_contributors_count} criterios explican{" "}
                      {typeof p.top_contributors_share === "number"
                        ? p.top_contributors_share.toFixed(1)
                        : p.top_contributors_share}
                      % del Need
                    </div>

                    <div className="mt-2 space-y-2">
                      {(p.top_contributors || []).slice(0, 3).map((c) => (
                        <div key={c.criteria_code} className="text-sm">
                          <span className="font-mono">{c.criteria_code}</span>{" "}
                          <span className="font-semibold">{c.title}</span>
                          <span className="text-amber-800">
                            {" "}
                            · gap {c.gap} · imp {c.importance} · contrib{" "}
                            {c.need_component}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Criterios cubiertos: {p.criteria_covered}
                  </div>

                  {/* ✅ NUEVO: CTA a acciones del programa */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/resultados/${assessmentId}/programas/${p.program_id}`
                        )
                      }
                      className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                      title="Ver acciones recomendadas dentro de este programa"
                    >
                      Ver acciones del programa
                    </button>

                    <button
                      onClick={() => router.push(hrefResultados)}
                      className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                    >
                      Volver a resultados
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => router.push(hrefResultados)}
              className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Volver a resultados
            </button>

            <button
              onClick={() => router.push(`/resultados/${assessmentId}/frenos`)}
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              title="Revisar frenos para entender el porqué de los programas"
            >
              Revisar frenos
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            assessmentId: <span className="font-mono">{assessmentId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
