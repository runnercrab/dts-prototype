"use client";

// src/app/resultados/[assessmentId]/ejecucion/roadmap/page.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type PhaseProgram = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;
  quadrant: "quick_win" | "transformational" | "foundation" | "maintenance";
  impact_score: number;
  effort_score: number;
  why_now: string;
};

type Phase = {
  phase: string; // "0-1" | "1-2" | "2-4"
  title: string;
  subtitle: string;
  programs: PhaseProgram[];
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  max_per_phase: number;
  count: number;
  phases: Phase[];
  rule?: any;
};

function quadrantPill(q: PhaseProgram["quadrant"]) {
  if (q === "quick_win") return "🟢 Quick win";
  if (q === "transformational") return "🔵 Transformacional";
  if (q === "foundation") return "🔴 Foundation";
  return "⚪ Maintenance";
}

export default function EjecucionRoadmapPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(
    () => (params?.assessmentId || "").toString().trim(),
    [params]
  );
  const valid = assessmentId && isUuid(assessmentId);

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

        const url = `/api/dts/results/roadmap?assessmentId=${assessmentId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Error cargando roadmap");
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
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        assessmentId inválido.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">Resultados · Ejecución</div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Roadmap por olas</h1>
            <div className="mt-2 text-slate-600">
              Secuenciamos por <b>capacidad de ejecución</b> (max por fase), no por moda.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/programas`)}
              className="bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              ← Programas
            </button>
            <button
              onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/matriz`)}
              className="bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              Matriz →
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Cargando roadmap…
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          {err}
        </div>
      ) : !data?.phases?.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay fases para mostrar.
        </div>
      ) : (
        <div className="space-y-4">
          {data.phases.map((ph) => (
            <div key={ph.phase} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-500">Fase {ph.phase}</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">{ph.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{ph.subtitle}</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Capacidad: <b>{data.max_per_phase}</b> prog/fase
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {ph.programs.map((p) => (
                    <div key={p.program_id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-slate-500">#{p.rank}</span>
                            <span className="text-sm font-mono text-slate-700">{p.program_code}</span>
                            <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {quadrantPill(p.quadrant)}
                            </span>
                            <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              Impacto {p.impact_score} · Esfuerzo {p.effort_score}
                            </span>
                          </div>

                          <div className="mt-2 text-lg font-bold text-slate-900">{p.title}</div>
                          <div className="mt-2 text-sm text-slate-600">{p.why_now}</div>
                        </div>

                        <Link
                          href={`/resultados/${assessmentId}/ejecucion/programas/${p.program_id}`}
                          className="shrink-0 inline-flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
                        >
                          Ver acciones
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6 text-xs text-slate-500">
                Nota: Foundation y Maintenance no entran en el roadmap inicial para mantener foco ejecutivo.
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500">
        assessmentId: <span className="font-mono">{assessmentId}</span> · pack:{" "}
        <span className="font-mono">{data?.pack ?? "-"}</span> · items: <b>{data?.count ?? 0}</b>
      </div>
    </div>
  );
}
