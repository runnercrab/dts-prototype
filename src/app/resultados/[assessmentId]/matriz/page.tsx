// src/app/resultados/[assessmentId]/matriz/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type MatrizItem = {
  rank: number;
  criterion_code: string;
  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;
  impact_score: number;
  effort_score: number;
  x_effort: number; // 0..1
  y_impact: number; // 0..1
  quadrant: "quick_wins" | "big_bets" | "foundations" | "fill_ins";
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

function quadrantName(q: MatrizItem["quadrant"]) {
  switch (q) {
    case "quick_wins":
      return "Quick Wins";
    case "big_bets":
      return "Big Bets";
    case "foundations":
      return "Foundations";
    default:
      return "Fill-ins";
  }
}

export default function MatrizPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    const v = (params?.assessmentId || "").toString().trim();
    return v;
  }, [params]);

  const [data, setData] = useState<MatrizResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Por defecto: 8 criterios en la matriz (tu decisión)
  const LIMIT = 8;

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

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold">Matriz Impacto / Esfuerzo</h1>
        <p className="mt-2 text-sm text-slate-600">Cargando…</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-3xl font-semibold">Matriz Impacto / Esfuerzo</h1>
          <p className="mt-2 text-sm text-red-700">{errorMsg ?? "No hay datos."}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              Volver
            </button>
            <a
              href={`/resultados/${assessmentId}/frenos`}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              Ir a Frenos
            </a>
          </div>
        </div>
      </div>
    );
  }

  const byQuadrant = {
    quick_wins: data.items.filter((i) => i.quadrant === "quick_wins"),
    big_bets: data.items.filter((i) => i.quadrant === "big_bets"),
    foundations: data.items.filter((i) => i.quadrant === "foundations"),
    fill_ins: data.items.filter((i) => i.quadrant === "fill_ins"),
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Matriz Impacto / Esfuerzo</h1>
        <p className="text-slate-600">
          Traducción CEO: <b>Impacto</b> = cuánto mejora negocio; <b>Esfuerzo</b> = coste/tiempo/riesgo para ejecutarlo.
          <span className="ml-2 text-sm text-slate-500">
            (mostrando top {data.limit})
          </span>
        </p>

        {data.disclaimer ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold">Nota</div>
            <div className="mt-1">{data.disclaimer}</div>
          </div>
        ) : null}
      </header>

      {/* Grid 2x2 */}
      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Mapa visual</h2>
          <div className="text-xs text-slate-600">
            Umbrales: Impacto alto ≥ {data.thresholds.impact_high} · Esfuerzo alto ≥ {data.thresholds.effort_high}
          </div>
        </div>

        <div className="mt-4">
          <div className="relative w-full overflow-hidden rounded-2xl border bg-white" style={{ height: 420 }}>
            {/* Divisores */}
            <div className="absolute inset-0">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200" />
            </div>

            {/* Etiquetas cuadrantes */}
            <div className="absolute left-4 top-4 text-xs text-slate-500">
              Alto Impacto · Bajo Esfuerzo
              <div className="font-semibold text-slate-800">Quick Wins</div>
            </div>
            <div className="absolute right-4 top-4 text-xs text-slate-500 text-right">
              Alto Impacto · Alto Esfuerzo
              <div className="font-semibold text-slate-800">Big Bets</div>
            </div>
            <div className="absolute left-4 bottom-4 text-xs text-slate-500">
              Bajo Impacto · Bajo Esfuerzo
              <div className="font-semibold text-slate-800">Fill-ins</div>
            </div>
            <div className="absolute right-4 bottom-4 text-xs text-slate-500 text-right">
              Bajo Impacto · Alto Esfuerzo
              <div className="font-semibold text-slate-800">Foundations</div>
            </div>

            {/* Ejes */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              Impacto ↑
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-500">
              Esfuerzo →
            </div>

            {/* Puntos */}
            {data.items.map((it) => {
              // padding para que no se peguen a los bordes
              const pad = 24;
              const x = `calc(${(it.x_effort * 100).toFixed(3)}% )`;
              const y = `calc(${((1 - it.y_impact) * 100).toFixed(3)}% )`; // invert y

              return (
                <div
                  key={`${it.criterion_code}-${it.rank}`}
                  className="absolute"
                  style={{
                    left: `calc(${x} * 1)`,
                    top: `calc(${y} * 1)`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title={`${quadrantName(it.quadrant)} · ${it.criterion_code} · Impacto ${it.impact_score}/5 · Esfuerzo ${it.effort_score}/5`}
                >
                  <div className="h-9 w-9 rounded-full border bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                    {it.rank}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            * Cada número es un freno. Haz click mental: <b>arriba-izquierda</b> = “hazlo ya”, <b>arriba-derecha</b> = “apuesta”, <b>abajo-derecha</b> = “base”, <b>abajo-izquierda</b> = “relleno”.
          </p>
        </div>
      </div>

      {/* Listado por cuadrantes (CEO entiende mejor esto que el scatter) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(
          [
            ["quick_wins", "Quick Wins", "Haz primero: alto impacto con poco esfuerzo."],
            ["big_bets", "Big Bets", "Apuestas: alto impacto pero requieren inversión/tiempo."],
            ["foundations", "Foundations", "Bases: trabajo duro que habilita el resto."],
            ["fill_ins", "Fill-ins", "Relleno: mejoras menores, solo si hay hueco."],
          ] as const
        ).map(([key, title, desc]) => {
          const list = byQuadrant[key];
          return (
            <div key={key} className="rounded-2xl border p-5">
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-slate-600 mt-1">{desc}</div>

              {list.length === 0 ? (
                <div className="mt-3 text-sm text-slate-500">—</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {list.map((it) => (
                    <div key={`${it.criterion_code}-${it.rank}`} className="rounded-xl border bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">
                          {it.rank}. {it.title}
                        </div>
                        <div className="text-xs text-slate-600 font-mono">{it.criterion_code}</div>
                      </div>
                      <div className="mt-1 text-sm text-slate-700">{it.plain_impact}</div>
                      <div className="mt-2 text-xs text-slate-600">
                        Impacto <b>{it.impact_score}/5</b> · Esfuerzo <b>{it.effort_score}/5</b>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`/resultados/${assessmentId}/frenos`}
          className="rounded-xl border px-4 py-3 text-sm text-center"
        >
          ← Volver a Frenos
        </a>
        <a
          href={`/resultados/${assessmentId}/roadmap`}
          className="rounded-xl bg-blue-600 text-white px-4 py-3 text-sm text-center"
        >
          Crear Roadmap temporal →
        </a>
      </div>
    </div>
  );
}
