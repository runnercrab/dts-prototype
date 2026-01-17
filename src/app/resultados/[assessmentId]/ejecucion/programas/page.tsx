"use client";

// src/app/resultados/[assessmentId]/ejecucion/programas/page.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type Contributor = {
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

  impact_score: number | null;
  effort_score: number | null;

  weighted_need: number | null;
  value_score: number | null;
  program_score: number | null;

  criteria_covered: number | null;

  notes: string | null;
  owner: string | null;

  priority_badge: string | null; // "🟢 TOP" | "🟡 MEDIA" ...
  priority_reason: string | null;

  top_contributors: Contributor[] | null;
  top_contributors_need: number | null;
  top_contributors_share: number | null;
  top_contributors_count: number | null;
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  thresholds?: { top: number; mid_end: number };
  count: number;
  items: ProgramItem[];
};

function badgeStyle(badge: string | null | undefined) {
  const b = (badge || "").toUpperCase();
  if (b.includes("🟢") || b.includes("TOP")) {
    return {
      wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-600",
      label: badge || "🟢 TOP",
    };
  }
  if (b.includes("🟡") || b.includes("MEDIA") || b.includes("MEDIUM")) {
    return {
      wrap: "border-amber-200 bg-amber-50 text-amber-900",
      dot: "bg-amber-500",
      label: badge || "🟡 MEDIA",
    };
  }
  return {
    wrap: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
    label: badge || "⚪ BAJA",
  };
}

function pill(text: string) {
  return (
    <span className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50">
      {text}
    </span>
  );
}

export default function EjecucionProgramasPage() {
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

        const url = `/api/dts/results/programs?assessmentId=${assessmentId}`;
        const res = await fetch(url, { cache: "no-store" });
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

  const hrefMatriz = `/resultados/${assessmentId}/ejecucion/matriz`;
  const hrefRoadmap = `/resultados/${assessmentId}/ejecucion/roadmap`;
  const hrefResultados = `/resultados/${assessmentId}`;
  const hrefFrenos = `/resultados/${assessmentId}/frenos`;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="text-sm text-slate-500">Resultados · Ejecución</div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Programas priorizados — qué hacer primero
          </h1>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Son <b>programas</b> (macro) que agrupan criterios del diagnóstico. Dentro de cada programa verás{" "}
            <b>acciones</b> (micro) para ejecutarlo paso a paso.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(hrefRoadmap)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
            >
              Ver roadmap por olas
            </button>

            <button
              onClick={() => router.push(hrefMatriz)}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              Ver matriz Impacto–Esfuerzo
            </button>

            <button
              onClick={() => router.push(hrefFrenos)}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              Revisar frenos
            </button>

            <button
              onClick={() => router.push(hrefResultados)}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              Volver a resultados
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Cómo se ordena</div>
            <div className="mt-1 text-sm text-slate-600">
              El backend calcula el ranking con: <b>Need ponderado × Impacto / Esfuerzo</b>.  
              Abajo ves el <b>por qué</b> (los criterios que más explican ese Need).
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Tu asistente</div>
            <div className="mt-2 text-sm text-slate-600">
              Te ayudo a decidir el orden real según capacidad y contexto.
            </div>

            <button
              onClick={() => router.push(`/chat?assessmentId=${assessmentId}`)}
              className="mt-4 w-full bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
            >
              Preguntar al asistente
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Consejo Big4</div>
            <div className="mt-2 text-sm text-slate-600">
              Empieza por <b>olas</b> (roadmap). La matriz es para validar la lógica, no para decidirlo todo.
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Cargando programas…
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
            const badge = badgeStyle(p.priority_badge);

            return (
              <div
                key={p.program_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-500">#{p.rank}</span>
                        <span className="text-sm font-mono text-slate-700">{p.program_code}</span>

                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                            badge.wrap,
                          ].join(" ")}
                        >
                          <span className={["h-2 w-2 rounded-full", badge.dot].join(" ")} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-3 text-2xl font-bold text-slate-900">
                        {p.title}
                      </div>

                      <div className="mt-2 text-sm text-slate-600">
                        Need {p.weighted_need ?? "—"} · Impact {p.impact_score ?? "—"} · Effort{" "}
                        {p.effort_score ?? "—"} · Score {p.program_score ?? "—"}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {pill(`Need ${p.weighted_need ?? "—"}`)}
                        {pill(`Impacto ${p.impact_score ?? "—"}`)}
                        {pill(`Esfuerzo ${p.effort_score ?? "—"}`)}
                        {p.criteria_covered != null ? pill(`${p.criteria_covered} criterios`) : null}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Score</div>
                      <div className="mt-1 text-4xl font-bold text-slate-900">
                        {p.program_score != null ? p.program_score.toFixed(0) : "—"}
                      </div>
                    </div>
                  </div>

                  {p.priority_reason ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">Por qué está aquí</div>
                      <div className="mt-1">{p.priority_reason}</div>
                    </div>
                  ) : null}

                  {p.top_contributors?.length ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-sm font-semibold text-amber-900">
                        Criterios que más explican el Need
                        {p.top_contributors_share != null ? (
                          <span className="font-normal">
                            {" "}
                            (≈ {p.top_contributors_share.toFixed(1)}%)
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 space-y-2">
                        {p.top_contributors.slice(0, 3).map((c) => (
                          <div
                            key={c.criteria_code}
                            className="flex items-start justify-between gap-4 text-sm text-amber-900"
                          >
                            <div className="min-w-0">
                              <span className="font-mono">{c.criteria_code}</span> ·{" "}
                              <span className="font-semibold">{c.title}</span>
                            </div>
                            <div className="shrink-0 text-amber-900/80">
                              Need {c.need_component}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/resultados/${assessmentId}/ejecucion/programas/${p.program_id}`}
                      className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
                    >
                      Ver acciones del programa
                    </Link>

                    <Link
                      href={`/resultados/${assessmentId}/ejecucion/matriz`}
                      className="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                    >
                      Ver en matriz
                    </Link>

                    <Link
                      href={`/resultados/${assessmentId}/ejecucion/roadmap`}
                      className="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                    >
                      Ver roadmap
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-xs text-slate-500">
        assessmentId: <span className="font-mono">{assessmentId}</span> · pack:{" "}
        <span className="font-mono">{data?.pack ?? "-"}</span> · programas:{" "}
        <b>{data?.count ?? 0}</b>
      </div>
    </div>
  );
}
