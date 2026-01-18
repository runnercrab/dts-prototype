"use client";

// src/app/(app)/resultados/[assessmentId]/ejecucion/programas/page.tsx
// ✅ Versión alineada con prototipo HTML - CEO-friendly

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type Contributor = {
  criteria_code: string;
  title: string;
  gap: number;
  importance: number;
  need_component: number;
};

type ProgramItem = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;
  impact_score: number | null;
  effort_score: number | null;
  weighted_need: number | null;
  program_score: number | null;
  criteria_covered: number | null;
  priority_badge: string | null;
  priority_reason: string | null;
  top_contributors: Contributor[] | null;
  top_contributors_share: number | null;
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: ProgramItem[];
};

// Badge styling based on priority
function getBadgeStyle(badge: string | null) {
  const b = (badge || "").toUpperCase();
  if (b.includes("TOP") || b.includes("🟢")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Prioridad alta",
    };
  }
  if (b.includes("MEDIA") || b.includes("🟡")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "Prioridad media",
    };
  }
  return {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Prioridad normal",
  };
}

// Translate impact/effort to CEO language
function getImpactLabel(score: number | null): string {
  if (score === null) return "—";
  if (score >= 4) return "Alto";
  if (score >= 3) return "Medio";
  return "Bajo";
}

function getEffortLabel(score: number | null): string {
  if (score === null) return "—";
  if (score <= 2) return "Bajo";
  if (score <= 3) return "Medio";
  return "Alto";
}

export default function EjecucionProgramasPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
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
        const res = await fetch(`/api/dts/results/programs?assessmentId=${assessmentId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error cargando programas");
        if (!cancelled) setData(json as ApiResponse);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
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
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Qué frentes abordar primero
        </h1>
        <p className="mt-2 text-slate-600">
          Estos no son tareas sueltas. Son programas de trabajo que agrupan acciones concretas 
          para resolver los problemas que hoy más te afectan.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/resultados/${assessmentId}/ejecucion/roadmap`}
            className="inline-flex items-center px-5 py-2.5 bg-blue-800 text-white rounded-xl font-semibold text-sm hover:bg-blue-900 transition"
          >
            Ver roadmap por olas
          </Link>
          <Link
            href={`/resultados/${assessmentId}/ejecucion/matriz`}
            className="inline-flex items-center px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
          >
            Ver matriz
          </Link>
        </div>

        {/* Info box */}
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-semibold text-blue-900">Cómo leer esta pantalla</div>
          <p className="mt-1 text-sm text-blue-800">
            Cada programa ataca varios problemas detectados en el diagnóstico. 
            Debajo verás los factores que más contribuyen a ese problema.
          </p>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-slate-600">Cargando programas…</p>
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            {err}
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No hay programas para mostrar con los datos actuales.
          </div>
        ) : (
          data!.items.map((p) => {
            const badge = getBadgeStyle(p.priority_badge);
            const impactLabel = getImpactLabel(p.impact_score);
            const effortLabel = getEffortLabel(p.effort_score);

            return (
              <div
                key={p.program_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text} ${badge.border} border`}>
                        🟢 {badge.label}
                      </span>

                      {/* Title */}
                      <h2 className="mt-3 text-xl font-bold text-slate-900">
                        {p.title}
                      </h2>

                      {/* Human explanation */}
                      {p.priority_reason && (
                        <p className="mt-2 text-slate-600">
                          {p.priority_reason}
                        </p>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className="text-4xl font-bold text-slate-900">
                        {p.program_score != null ? p.program_score.toFixed(0) : "—"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">puntos</div>
                    </div>
                  </div>

                  {/* Top contributors - Why this program matters */}
                  {p.top_contributors && p.top_contributors.length > 0 && (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        Por qué este programa es prioritario
                      </div>
                      <p className="mt-1 text-sm text-slate-600 mb-3">
                        Estos factores explican la mayor parte del problema actual:
                      </p>
                      <div className="space-y-2">
                        {p.top_contributors.slice(0, 3).map((c) => (
                          <div key={c.criteria_code} className="flex items-start gap-2 text-sm">
                            <span className="text-slate-400">•</span>
                            <div>
                              <span className="font-semibold text-slate-800">{c.title}</span>
                              <span className="text-slate-500 ml-2">
                                (brecha alta, impacto en negocio)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metrics - Secondary, not protagonists */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Impacto <span className="font-semibold text-slate-700">{impactLabel}</span></span>
                    <span>·</span>
                    <span>Esfuerzo <span className="font-semibold text-slate-700">{effortLabel}</span></span>
                    {p.criteria_covered != null && (
                      <>
                        <span>·</span>
                        <span>{p.criteria_covered} criterios afectados</span>
                      </>
                    )}
                  </div>

                  {/* Single CTA */}
                  <div className="mt-5">
                    <Link
                      href={`/resultados/${assessmentId}/ejecucion/programas/${p.program_id}`}
                      className="inline-flex items-center px-6 py-3 bg-blue-800 text-white rounded-xl font-semibold text-sm hover:bg-blue-900 transition"
                    >
                      Ver cómo ejecutarlo →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
        <Link
          href={`/resultados/${assessmentId}`}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a resultados
        </Link>
        <Link
          href={`/resultados/${assessmentId}/frenos`}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Revisar frenos detectados
        </Link>
      </div>
    </div>
  );
}