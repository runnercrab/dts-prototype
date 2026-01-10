"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type PriorityBand = "high" | "medium" | "low";

type PriorityItem = {
  rank: number;
  criteria_code: string;
  title: string;
  plain_impact: string;
  gap_levels: number;
  importance: number;
  priority: number;
  band: PriorityBand;
};

type PriorResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: PriorityItem[];
  disclaimer?: string;
};

function badgeBand(band: PriorityBand) {
  if (band === "high") return { label: "PRIORIDAD ALTA", sub: "(Atender primero)" };
  if (band === "medium") return { label: "PRIORIDAD MEDIA", sub: "" };
  return { label: "PRIORIDAD BAJA", sub: "" };
}

function pill(label: string, value: string) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export default function PriorizacionPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    return (params?.assessmentId || "").toString().trim();
  }, [params]);

  const [data, setData] = useState<PriorResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          `/api/dts/results/priorizacion?assessmentId=${encodeURIComponent(
            assessmentId
          )}&limit=${LIMIT}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status}: ${text || "sin detalle"}`);
        }

        const json = (await res.json()) as PriorResponse;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || "Error cargando priorización.");
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

  const grouped = useMemo(() => {
    const items = data?.items || [];
    return {
      high: items.filter((x) => x.band === "high"),
      medium: items.filter((x) => x.band === "medium"),
      low: items.filter((x) => x.band === "low"),
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
                title="Volver"
              >
                ← Volver
              </button>

              <span className="text-slate-300">|</span>

              <a
                href={`/resultados/${assessmentId}`}
                className="text-sm text-slate-600 hover:text-slate-900"
                title="Resultado Ejecutivo"
              >
                Resultado Ejecutivo
              </a>
            </div>

            <div className="flex-1 text-center">
              <div className="text-lg sm:text-xl font-semibold text-slate-900">
                Priorización inicial
              </div>
              <div className="text-xs sm:text-sm text-slate-600">
                Dónde te conviene mirar primero (aún no son acciones)
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled
                title="Disponible cuando definamos iniciativas"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium"
              >
                Crear Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="py-6 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-600">Cargando priorización…</div>
        ) : errorMsg || !data ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            {errorMsg ?? "No hay datos."}
          </div>
        ) : (
          <>
            {/* Caja explicativa CEO */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              Esta lista muestra en qué criterios hay más riesgo u oportunidad, según tu brecha y la importancia.
              <br />
              Todavía no son acciones: indica dónde conviene profundizar.
              <div className="mt-2 text-xs text-slate-500">
                Haz clic en un criterio para ver opciones de mejora (iniciativas).
              </div>
            </div>

            {/* Nota MVP (si existe) */}
            {data.disclaimer ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Nota (MVP)</div>
                <div className="mt-1">{data.disclaimer}</div>
              </div>
            ) : null}

            {/* Secciones */}
            {(["high", "medium", "low"] as const).map((k) => {
              const meta = badgeBand(k);
              const list = grouped[k];

              return (
                <div key={k} className="rounded-2xl border border-slate-200 bg-white">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
                    {meta.sub ? (
                      <div className="text-xs text-slate-500 mt-1">{meta.sub}</div>
                    ) : null}
                  </div>

                  {list.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-slate-600">Sin elementos.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {list.map((it) => (
                        <div
                          key={`${it.criteria_code}-${it.rank}`}
                          className="px-5 py-4 cursor-pointer hover:bg-slate-50"
                          onClick={() =>
                            router.push(
                              `/resultados/${assessmentId}/iniciativas/${it.criteria_code}`
                            )
                          }
                          title="Ver opciones de mejora"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-xs text-slate-500">#{it.rank}</div>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-700">
                                  {it.criteria_code}
                                </span>
                                <div className="text-sm font-semibold text-slate-900">
                                  {it.title}
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-slate-700">
                                <span className="font-semibold">Impacto negocio:</span>{" "}
                                {it.plain_impact || "—"}
                              </div>

                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                {pill("Brecha (niveles)", `${it.gap_levels}`)}
                                {pill("Importancia (1–5)", `${it.importance}/5`)}
                              </div>
                            </div>

                            <div className="shrink-0 text-xs text-slate-500">
                              prioridad: <span className="font-semibold">{it.priority}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
