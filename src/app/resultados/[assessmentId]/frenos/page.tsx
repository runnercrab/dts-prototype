// src/app/resultados/[assessmentId]/frenos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type FrenoItem = {
  rank: number;
  criteria_code: string; // ✅ TMF real: "1.1.1"
  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;
  impact_score: number; // legacy (informativo)
  effort_score: number; // legacy (informativo)
  note?: string;
};

type FrenosResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: FrenoItem[];
  disclaimer?: string;
};

// 🔴 Frenos visual semantics (README)
const FRENOS_MAIN = "#DC2626"; // rojo ejecutivo
const FRENOS_BG = "#FEF2F2"; // fondo suave
const FRENOS_BORDER = "#FECACA"; // red-200 aprox
const FRENOS_TEXT = "#991B1B"; // red-800 aprox

function scorePill(label: string, value: number) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}/5</span>
    </span>
  );
}

export default function FrenosPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    return (params?.assessmentId || "").toString().trim();
  }, [params]);

  const [data, setData] = useState<FrenosResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErrorMsg(null);
      setData(null);

      if (!assessmentId || !isUuid(assessmentId)) {
        setLoading(false);
        setErrorMsg("assessmentId inválido.");
        return;
      }

      try {
        const res = await fetch(
          `/api/dts/results/frenos?assessmentId=${encodeURIComponent(assessmentId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status}: ${text || "sin detalle"}`);
        }

        const json = (await res.json()) as FrenosResponse;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || "Error cargando frenos.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [assessmentId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar (clonado del diagnóstico) */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Volver"
              >
                ← Volver
              </button>

              <span className="text-gray-300">|</span>

              <a
                href={`/resultados/${assessmentId}/matriz`}
                className="text-sm text-gray-600 hover:text-gray-900"
                title="Ir a Matriz"
              >
                Matriz
              </a>

              <span className="text-gray-300">|</span>

              {/* CTA positivo: mantener azul (acción siguiente) */}
              <a
                href={`/resultados/${assessmentId}/roadmap`}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm"
                title="Crear roadmap"
              >
                Crear Roadmap →
              </a>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Frenos del negocio
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Prioridad por respuestas (gap × importancia). Lenguaje CEO.
              </p>
            </div>

            <div className="w-[100px] lg:hidden" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando frenos...</p>
            </div>
          </div>
        ) : errorMsg || !data ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">{errorMsg ?? "No hay datos."}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Reintentar
              </button>
              <a
                href={`/resultados?assessmentId=${assessmentId}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm"
              >
                Ir a Resultados
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nota / disclaimer */}
            {data.disclaimer ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <div className="font-semibold">Nota (MVP)</div>
                <div className="mt-1">{data.disclaimer}</div>
              </div>
            ) : null}

            {/* KPI mini (estilo diagnóstico) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Pack</div>
                <div className="mt-1 font-mono text-sm text-gray-900">
                  {data.pack}
                </div>
              </div>

              {/* KPI de frenos: rojo */}
              <div
                className="rounded-2xl shadow-sm border p-4"
                style={{ backgroundColor: FRENOS_BG, borderColor: FRENOS_BORDER }}
              >
                <div className="text-xs" style={{ color: FRENOS_TEXT }}>
                  Frenos detectados
                </div>
                <div className="mt-1 text-3xl font-bold" style={{ color: FRENOS_TEXT }}>
                  {data.count}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Siguiente paso</div>
                <a
                  className="mt-1 inline-block text-sm font-semibold text-[#2563eb] hover:underline"
                  href={`/resultados/${assessmentId}/matriz`}
                >
                  Matriz Impacto/Esfuerzo →
                </a>
                <div className="text-xs text-gray-500 mt-1">(priorización visual)</div>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Los {data.count} frenos (uno por uno)
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Impacto (negocio), síntoma típico y acción sugerida.
                  </p>
                </div>

                <a
                  href={`/resultados/${assessmentId}/matriz`}
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                >
                  Ver Matriz →
                </a>
              </div>

              <div className="mt-4 space-y-3">
                {data.items.map((it) => (
                  <div
                    key={`${it.criteria_code}-${it.rank}`}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: FRENOS_BG, borderColor: FRENOS_BORDER }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* rank chip: rojo */}
                        <div
                          className="h-8 w-8 shrink-0 rounded-xl text-white flex items-center justify-center text-xs font-bold shadow-sm"
                          style={{ backgroundColor: FRENOS_MAIN }}
                          title="Prioridad"
                        >
                          {it.rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {it.title || it.criteria_code}
                            </div>

                            {/* criteria code badge: borde rojo suave */}
                            <span
                              className="rounded-full border bg-white px-2 py-0.5 text-xs font-mono"
                              style={{ borderColor: FRENOS_BORDER, color: FRENOS_TEXT }}
                              title="Código TMF"
                            >
                              {it.criteria_code}
                            </span>
                          </div>

                          {/* 3 columnas compactas */}
                          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                              <div className="text-xs text-gray-500">Impacto (negocio)</div>
                              <div className="mt-1 text-gray-800">
                                {it.plain_impact || "—"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                              <div className="text-xs text-gray-500">Síntoma típico</div>
                              <div className="mt-1 text-gray-800">{it.symptom || "—"}</div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                              <div className="text-xs text-gray-500">Acción sugerida</div>
                              <div className="mt-1 text-gray-800">
                                {it.suggested_action || "—"}
                              </div>
                            </div>
                          </div>

                          {it.note ? (
                            <div className="mt-3 text-xs" style={{ color: FRENOS_TEXT }}>
                              ⚠️ {it.note}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {scorePill("Impacto", it.impact_score)}
                        {scorePill("Esfuerzo", it.effort_score)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA inferior */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`/resultados?assessmentId=${assessmentId}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-center hover:bg-gray-50"
              >
                ← Volver a Resultados
              </a>
              <a
                href={`/resultados/${assessmentId}/matriz`}
                className="rounded-xl bg-[#2563eb] text-white px-4 py-3 text-sm text-center font-semibold hover:bg-blue-700"
              >
                Matriz Impacto/Esfuerzo →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
