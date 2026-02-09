"use client";

// src/app/(app)/resultados/[assessmentId]/ejecucion/roadmap/page.tsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type PhaseProgram = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;
  quadrant: "quick_win" | "transformational" | "foundation" | "maintenance" | "unknown";
  impact_score: number | null;
  effort_score: number | null;
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
  mode?: string;
  hint?: string;
};

function quadrantPill(q: PhaseProgram["quadrant"]) {
  if (q === "quick_win") return "🟢 Quick win";
  if (q === "transformational") return "🔵 Transformacional";
  if (q === "foundation") return "🔴 Foundation";
  if (q === "maintenance") return "⚪ Maintenance";
  return "⚪ Por priorizar";
}

type ActivateProgramOk = {
  ok: true;
  requestId?: string;
  assessment_id?: string;
  program_id?: string;
  program_instance_id?: string;
  redirect_url?: string;
  hint?: string;
};

type ActivateProgramErr = {
  ok: false;
  error: string;
  details?: string | null;
  requestId?: string;
};

type ActivateProgramResponse = ActivateProgramOk | ActivateProgramErr;

async function postActivateProgram(params: { assessmentId: string; programId: string }) {
  const res = await fetch("/api/dts/execution/activate_from_roadmap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      assessmentId: params.assessmentId,
      programId: params.programId,
    }),
  });

  const data = (await res.json().catch(() => null)) as ActivateProgramResponse | null;
  if (!data) throw new Error(`Invalid JSON (HTTP ${res.status})`);

  if (!res.ok || data.ok === false) {
    const msg = data.ok === false ? String(data.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/**
 * Leemos el “programa activo” desde el endpoint de seguimiento (read-only).
 * Esto evita inventarnos otro endpoint ahora mismo.
 *
 * Esperamos que devuelva algo como:
 * - program_instance_id (o active_program_instance_id)
 * - program_id (o active_program_id)
 *
 * Si no existe, devolvemos nulls sin romper UI.
 */
async function fetchActiveProgram(assessmentId: string): Promise<{
  program_instance_id: string | null;
  program_id: string | null;
}> {
  const url = `/api/dts/results/seguimiento?assessmentId=${assessmentId}`;
  const res = await fetch(url, { cache: "no-store" });

  // Si el endpoint no existe o falla, no rompemos Roadmap.
  if (!res.ok) return { program_instance_id: null, program_id: null };

  const json = (await res.json().catch(() => null)) as any;
  if (!json || typeof json !== "object") return { program_instance_id: null, program_id: null };

  const pid =
    typeof json.program_instance_id === "string"
      ? json.program_instance_id
      : typeof json.active_program_instance_id === "string"
      ? json.active_program_instance_id
      : null;

  const progId =
    typeof json.program_id === "string"
      ? json.program_id
      : typeof json.active_program_id === "string"
      ? json.active_program_id
      : typeof json.program?.program_id === "string"
      ? json.program.program_id
      : null;

  return {
    program_instance_id: pid && isUuid(pid) ? pid : null,
    program_id: progId && isUuid(progId) ? progId : null,
  };
}

export default function EjecucionRoadmapPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
  const valid = assessmentId && isUuid(assessmentId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const [activeProgramId, setActiveProgramId] = useState<string | null>(null);
  const [activeProgramInstanceId, setActiveProgramInstanceId] = useState<string | null>(null);

  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activateErr, setActivateErr] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        setActivateErr(null);

        // 1) Roadmap (olas)
        const url = `/api/dts/results/roadmap?assessmentId=${assessmentId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error cargando roadmap");
        if (!cancelled) setData(json as ApiResponse);

        // 2) Programa activo (si existe)
        const active = await fetchActiveProgram(assessmentId);
        if (!cancelled) {
          setActiveProgramId(active.program_id);
          setActiveProgramInstanceId(active.program_instance_id);
        }
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

  async function onActivate(programId: string) {
    if (!valid) return;

    setActivateErr(null);
    setActivatingId(programId);

    try {
      const resp = await postActivateProgram({ assessmentId, programId });

      // refrescamos el “activo” localmente (por consistencia visual)
      if (resp.program_id) setActiveProgramId(resp.program_id);
      if (resp.program_instance_id) setActiveProgramInstanceId(resp.program_instance_id);

      const redirectUrl =
        typeof resp.redirect_url === "string" && resp.redirect_url.length > 0
          ? resp.redirect_url
          : `/resultados/${assessmentId}/ejecucion/seguimiento`;

      router.push(redirectUrl);
      router.refresh();
    } catch (e: any) {
      setActivateErr(e?.message || "No se ha podido iniciar el programa");
    } finally {
      setActivatingId(null);
    }
  }

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

            {data?.hint ? (
              <div className="mt-3 text-sm text-slate-600">{data.hint}</div>
            ) : null}

            {activeProgramId ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                <span className="font-semibold">✅ Hay un programa activo</span>
                <span className="text-emerald-700">
                  (se ejecuta en Seguimiento)
                </span>
                <button
                  onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/seguimiento`)}
                  className="ml-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Ir a Seguimiento
                </button>
              </div>
            ) : null}
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

        {activateErr ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
            <div className="text-sm font-semibold">No se ha podido iniciar</div>
            <div className="mt-1 text-sm">{activateErr}</div>
          </div>
        ) : null}
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
            <div
              key={ph.phase}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
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
                  {ph.programs.map((p) => {
                    const isActive = !!activeProgramId && p.program_id === activeProgramId;
                    const isActivating = activatingId === p.program_id;

                    return (
                      <div key={p.program_id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm text-slate-500">#{p.rank}</span>

                              {p.program_code ? (
                                <span className="text-sm font-mono text-slate-700">{p.program_code}</span>
                              ) : null}

                              <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                                {quadrantPill(p.quadrant)}
                              </span>

                              <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                                Impacto {p.impact_score ?? "—"} · Esfuerzo {p.effort_score ?? "—"}
                              </span>

                              {isActive ? (
                                <span className="text-xs px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
                                  ✅ Activo
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 text-lg font-bold text-slate-900">{p.title}</div>
                            <div className="mt-2 text-sm text-slate-600">{p.why_now}</div>
                          </div>

                          <div className="shrink-0 flex flex-col gap-2 items-end">
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/seguimiento`)}
                                className="inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                              >
                                Ir a Seguimiento
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isActivating}
                                onClick={() => onActivate(p.program_id)}
                                className="inline-flex items-center justify-center bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-50"
                                title="Crea ejecución (program_instance + action_instances) y te lleva a Seguimiento"
                              >
                                {isActivating ? "Iniciando…" : "Iniciar programa"}
                              </button>
                            )}

                            {/* Secundario (no es el camino CEO feliz) */}
                            <Link
                              href={`/resultados/${assessmentId}/ejecucion/programas/${p.program_id}`}
                              className="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                              title="Vista de detalle del programa (si tu router la soporta)"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </div>

                        {isActive && activeProgramInstanceId ? (
                          <div className="mt-3 text-xs text-slate-500">
                            program_instance_id activo:{" "}
                            <span className="font-mono">{activeProgramInstanceId}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
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
