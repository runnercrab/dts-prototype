// src/app/resultados/[assessmentId]/programas/[programId]/page.tsx
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

type ActionItem = {
  rank: number;
  action_id: string;
  action_code: string;
  title: string;
  description: string | null;
  status: string | null;
  impact_score: number;
  effort_score: number;
  weighted_need: number;
  value_score: number;
  action_score: number;
  criteria_covered: number;
  notes: string | null;
  owner: string | null;
  priority_badge: string;
  priority_reason: string;
  top_contributors: TopContributor[];
  top_contributors_need: number;
  top_contributors_share: number;
  top_contributors_count: number;
};

type ApiResponse = {
  assessment_id: string;
  program_id: string;
  pack: string;
  thresholds: { top: number; mid_end: number };
  count: number;
  items: ActionItem[];
};

export default function ProgramActionsPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string; programId: string }>();

  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
  const programId = useMemo(() => (params?.programId || "").toString().trim(), [params]);

  const valid = assessmentId && isUuid(assessmentId) && programId && isUuid(programId);

  const hrefProgramas = valid ? `/resultados/${assessmentId}/iniciativas` : `/resultados`;
  const hrefResultados = valid ? `/resultados/${assessmentId}` : `/resultados`;

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

        const url = `/api/dts/results/program-actions?assessmentId=${assessmentId}&programId=${programId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as ApiResponse | { error: string; details?: string };

        if (!res.ok) {
          const msg = (json as any)?.error || "Error cargando acciones";
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
  }, [assessmentId, programId, valid]);

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            assessmentId/programId inválidos.
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
            onClick={() => router.push(hrefProgramas)}
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            title="Volver a programas"
          >
            ← Volver
          </button>

          <div className="text-sm text-slate-500">Acciones del programa</div>

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
            Acciones (micro) — qué ejecutar dentro del programa
          </div>

          <div className="mt-3 text-slate-700 leading-relaxed">
            Estas acciones salen del <b>catálogo</b> y se priorizan por{" "}
            <b>Need × Impact / Effort</b>, igual que los programas.
          </div>

          {loading && <div className="mt-6 text-sm text-slate-600">Cargando…</div>}

          {err && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 text-sm">
              {err}
            </div>
          )}

          {!loading && !err && data && data.count === 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 text-sm">
              No hay acciones mapeadas a este programa (o no hay gaps/importancia en criterios ligados).
              <div className="mt-2 text-amber-900/80">
                Revisa: <b>dts_program_action_map</b> y <b>dts_action_criteria_map</b>.
              </div>
            </div>
          )}

          {!loading && !err && data && data.count > 0 && (
            <div className="mt-8 space-y-4">
              {data.items.map((a) => (
                <div key={a.action_id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-500">
                        #{a.rank} · {a.action_code} ·{" "}
                        <span className="font-semibold">{a.priority_badge}</span>
                      </div>

                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {a.title}
                      </div>

                      {a.description && (
                        <div className="mt-2 text-sm text-slate-700">
                          {a.description}
                        </div>
                      )}

                      <div className="mt-2 text-sm text-slate-700">
                        {a.priority_reason}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Score</div>
                      <div className="text-2xl font-semibold text-slate-900">
                        {Math.round(a.action_score * 10) / 10}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Need {a.weighted_need} · Impact {a.impact_score} · Effort {a.effort_score}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="text-sm font-semibold">
                      Top contributors: {a.top_contributors_share?.toFixed?.(1) ?? a.top_contributors_share}% del Need
                    </div>
                    <div className="mt-2 space-y-2">
                      {(a.top_contributors || []).map((c) => (
                        <div key={c.criteria_code} className="text-sm">
                          <span className="font-mono">{c.criteria_code}</span>{" "}
                          <span className="font-semibold">{c.title}</span>
                          <span className="text-amber-800">
                            {" "}· gap {c.gap} · imp {c.importance} · contrib {c.need_component}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Criterios cubiertos: {a.criteria_covered}
                    {a.status ? <> · status: {a.status}</> : null}
                    {a.owner ? <> · owner: {a.owner}</> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-xs text-slate-500">
            assessmentId: <span className="font-mono">{assessmentId}</span>
            <br />
            programId: <span className="font-mono">{programId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
