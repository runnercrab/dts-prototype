// src/app/resultados/[assessmentId]/matriz/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UI, quadrantStyle, type QuadrantKey } from "@/lib/ui-tokens";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type MatrizItem = {
  rank: number;
  criteria_code: string; // TMF real (1.1.1)
  title: string;
  plain_impact: string;

  // futuros (cuando existan iniciativas reales)
  symptom: string;
  suggested_action: string;

  impact_score: number; // legacy UI (informativo)
  effort_score: number; // 1..5 desde BD
  x_effort: number; // 0..1
  y_impact: number; // 0..1
  quadrant: QuadrantKey;
  quadrant_label_es: string;
  note?: string;
};

type MatrizResponse = {
  assessment_id: string;
  pack: string;
  limit: number;
  thresholds: { impact_high: number; effort_high: number };
  items: MatrizItem[];
  disclaimer?: string;
};

function quadrantMeta(q: MatrizItem["quadrant"]) {
  switch (q) {
    case "quick_wins":
      return { title: "Quick Wins", desc: "Haz primero: alto impacto con poco esfuerzo." };
    case "big_bets":
      return { title: "Big Bets", desc: "Apuestas: alto impacto pero requieren inversión/tiempo." };
    case "foundations":
      return { title: "Foundations", desc: "Bases: trabajo duro que habilita el resto." };
    default:
      return { title: "Fill-ins", desc: "Relleno: mejoras menores, solo si hay hueco." };
  }
}

function scorePill(label: string, value: number) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-white px-2 py-1 text-xs text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}/5</span>
    </span>
  );
}

export default function MatrizPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    return (params?.assessmentId || "").toString().trim();
  }, [params]);

  const [data, setData] = useState<MatrizResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ MVP12: mostrar todo el pack (12)
  const LIMIT = 12;

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
          `/api/dts/results/matriz?assessmentId=${encodeURIComponent(assessmentId)}&limit=${LIMIT}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status}: ${text || "sin detalle"}`);
        }

        const json = (await res.json()) as MatrizResponse;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || "Error cargando matriz.");
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

  const byQuadrant = useMemo(() => {
    const items = data?.items || [];
    return {
      quick_wins: items.filter((i) => i.quadrant === "quick_wins"),
      big_bets: items.filter((i) => i.quadrant === "big_bets"),
      foundations: items.filter((i) => i.quadrant === "foundations"),
      fill_ins: items.filter((i) => i.quadrant === "fill_ins"),
    };
  }, [data]);

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
                href={`/resultados/${assessmentId}/frenos`}
                className="text-sm text-gray-600 hover:text-gray-900"
                title="Ir a Frenos"
              >
                Frenos
              </a>

              <span className="text-gray-300">|</span>

              <a
                href={`/resultados/${assessmentId}/roadmap`}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                title="Crear roadmap"
              >
                Crear Roadmap →
              </a>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Matriz Impacto / Esfuerzo
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Impacto = prioridad (gap × importancia) · Esfuerzo = effort_base (BD)
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
              <p className="text-gray-600">Cargando matriz...</p>
            </div>
          </div>
        ) : errorMsg || !data ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{errorMsg ?? "No hay datos."}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nota / disclaimers */}
            {data.disclaimer ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <div className="font-semibold">Nota (MVP)</div>
                <div className="mt-1">{data.disclaimer}</div>
              </div>
            ) : null}

            {/* Aclaración “criterios vs iniciativas” */}
            <div className={`${UI.radius.page} bg-white border border-gray-200 shadow-sm p-5`}>
              <div className="text-sm font-semibold text-gray-900">Qué es esto</div>
              <div className="mt-1 text-sm text-gray-600">
                Ahora mismo esta matriz es de <b>criterios</b> (priorización del diagnóstico), porque aún no
                existe el módulo de <b>iniciativas</b>. Cuando lo creemos, cada criterio se convertirá en
                acciones tipo <span className="font-mono">1.1.1.a</span>,{" "}
                <span className="font-mono">1.1.1.b</span>… y esta pantalla pasará a ser la matriz real de iniciativas.
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Mostrando: <b>top {data.limit}</b> (MVP12 = 12)
              </div>
            </div>

            {/* Cuadrantes (4 colores “diagnóstico”) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(["quick_wins", "big_bets", "foundations", "fill_ins"] as const).map((key) => {
                const meta = quadrantMeta(key);
                const list = byQuadrant[key];
                const st = quadrantStyle(key);

                return (
                  <div
                    key={key}
                    className={`${UI.radius.page} border p-5`}
                    style={{ background: st.bg, borderColor: st.border }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-base font-bold text-gray-900">{meta.title}</div>
                          <span
                            className="text-[10px] px-2 py-1 rounded-full font-semibold"
                            style={{ background: st.chipBg, color: st.chipText }}
                          >
                            {list.length ? `${list.length} items` : "0 items"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{meta.desc}</div>
                      </div>

                      <div className="text-xs text-slate-600">
                        {key === "quick_wins" ? "↑ impacto / ↓ esfuerzo" : null}
                      </div>
                    </div>

                    {list.length === 0 ? (
                      <div className="mt-4 text-sm text-slate-600">Sin elementos.</div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {list.map((it) => (
                          <div
                            key={`${it.criteria_code}-${it.rank}`}
                            className={`${UI.radius.card} border bg-white p-4`}
                            style={{ borderColor: UI.colors.border }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                {/* chip rank del color del cuadrante */}
                                <div
                                  className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm"
                                  style={{ background: st.chipBg, color: st.chipText }}
                                  title={`Rank #${it.rank}`}
                                >
                                  {it.rank}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-sm font-semibold text-gray-900 truncate">
                                      {it.title || it.criteria_code}
                                    </div>
                                    <span className="rounded-full border bg-white px-2 py-0.5 text-xs font-mono text-gray-700">
                                      {it.criteria_code}
                                    </span>
                                  </div>

                                  {it.plain_impact ? (
                                    <div className="mt-1 text-sm text-gray-700">
                                      {it.plain_impact}
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-sm text-gray-500">(Sin descripción disponible)</div>
                                  )}

                                  {it.note ? (
                                    <div className="mt-2 text-xs text-amber-700">⚠️ {it.note}</div>
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
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA inferior */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`/resultados/${assessmentId}/frenos`}
                className={`${UI.radius.card} border border-gray-200 bg-white px-4 py-3 text-sm text-center hover:bg-gray-50`}
              >
                ← Volver a Frenos
              </a>
              <a
                href={`/resultados/${assessmentId}/roadmap`}
                className={`${UI.radius.card} bg-[#2563eb] text-white px-4 py-3 text-sm text-center font-semibold hover:bg-blue-700`}
              >
                Crear Roadmap →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
