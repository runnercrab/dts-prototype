"use client";

// src/app/dts/roadmap/[assessmentId]/page.tsx
//
// M3 paso 5-bis — Pantalla del plan de acción (roadmap v3).
// Consume /api/dts/results/roadmap (que ya sirve el motor v3 para gapply_v23
// y el camino legacy para el resto) y pinta lo MÍNIMO: fases con etiqueta
// mecánica, programas por fase, y el texto de gate/no_medible tal cual viene
// del motor (campo `why_now`). Diseño fino = papeleta-UI.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  // Texto de gate/no_medible ya renderizado por el motor (vacío si no hay gate).
  why_now?: string;
};

type Phase = {
  phase: string;
  title: string;
  subtitle?: string;
  programs: PhaseProgram[];
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  max_per_phase: number;
  count: number;
  phases: Phase[];
  payload_version?: string;
};

export default function DtsRoadmapPage() {
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
    if (!valid) {
      setLoading(false);
      setErr("assessmentId inválido.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(
          `/api/dts/results/roadmap?assessmentId=${assessmentId}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || `Error ${res.status} cargando el plan.`);
        }
        if (!cancelled) setData(json as ApiResponse);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error desconocido cargando el plan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, valid]);

  const phases = data?.phases ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <div className="text-sm text-slate-500">Plan de acción</div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Tu roadmap priorizado
          </h1>
          <p className="mt-2 text-slate-600">
            Programas ordenados por fase. Cuando un programa depende de otro,
            te lo indicamos con su motivo.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Cargando tu plan…
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            No se ha podido cargar el plan de acción. {err}
          </div>
        ) : phases.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Todavía no hay un plan que mostrar. Completa el diagnóstico para
            generar tu roadmap.
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((ph) => (
              <div
                key={ph.phase}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="p-6">
                  <div className="text-sm text-slate-500">Fase {ph.phase}</div>
                  {ph.title ? (
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {ph.title}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3">
                    {ph.programs.map((p) => {
                      // Gating (payload v3 manda): why_now no-vacío ⟺ bloqueado/
                      // no_medible → NO se ofrece ejecución activa (item 5).
                      const gated = !!(p.why_now && p.why_now.length > 0);
                      return (
                        <div
                          key={p.program_id || p.program_code || String(p.rank)}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-slate-500">
                              #{p.rank}
                            </span>
                            {p.program_code ? (
                              <span className="font-mono text-sm text-slate-700">
                                {p.program_code}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {p.title}
                          </div>
                          {gated ? (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                              {p.why_now}
                            </div>
                          ) : p.program_code ? (
                            <div className="mt-3">
                              <Link
                                href={`/dts/roadmap/${assessmentId}/programas/${encodeURIComponent(
                                  p.program_code
                                )}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                              >
                                Ver acciones →
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href={`/dts/resultados/${assessmentId}`}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Volver a resultados
          </Link>
        </div>
      </div>
    </div>
  );
}
