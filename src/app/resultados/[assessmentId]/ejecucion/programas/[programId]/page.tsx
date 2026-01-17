//src/app/resultados/[assessmentId]/ejecucion/programas/[programId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ActionStatus = "todo" | "in_progress" | "done" | null;

type ActionItem = {
  sort_order?: number;
  action_id: string;
  action_code: string;
  title: string;
  description?: string | null;

  effort_score?: number | null;
  impact_score?: number | null;
  typical_duration_weeks?: number | null;

  owner_hint?: string | null;
  prerequisites?: string | null;
  tools_hint?: string | null;
  tags?: string[] | null;

  status?: ActionStatus;
  notes?: string | null;
  owner?: string | null;
};

type Progress = {
  total: number;
  done: number;
  in_progress: number;
  todo: number;
  pct_done: number; // 0..100 (1 decimal)
  pct_started: number;
};

type ApiResponse = {
  assessment_id: string;
  program_id: string;
  pack?: string;
  mode?: string;
  count: number;
  progress?: Progress;
  items: ActionItem[];
};

function statusLabel(s: ActionStatus) {
  if (s === "done") return "Hecho";
  if (s === "in_progress") return "En curso";
  return "Pendiente";
}

function statusPillClass(s: ActionStatus) {
  if (s === "done") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s === "in_progress") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ProgramActionsPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string; programId: string }>();

  const assessmentId = useMemo(
    () => (params?.assessmentId || "").toString().trim(),
    [params]
  );
  const programId = useMemo(
    () => (params?.programId || "").toString().trim(),
    [params]
  );

  const valid =
    assessmentId && programId && isUuid(assessmentId) && isUuid(programId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const [savingActionId, setSavingActionId] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function load() {
    const url = `/api/dts/results/program-actions?assessmentId=${assessmentId}&programId=${programId}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Error cargando acciones");
    setData(json as ApiResponse);
  }

  useEffect(() => {
    if (!valid) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (!cancelled) await load();
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, programId, valid]);

  async function setActionStatus(actionId: string, status: Exclude<ActionStatus, null>) {
    try {
      setSavingActionId(actionId);
      setSaveErr(null);

      // Optimista: reflejar instantáneo
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.action_id === actionId ? { ...it, status } : it
          ),
        };
      });

      const res = await fetch(`/api/dts/results/action-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          assessment_id: assessmentId,
          action_id: actionId,
          status,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "No se pudo guardar el estado");
      }

      // Verdad backend: recargar (también recalcula progress en backend)
      await load();
    } catch (e: any) {
      setSaveErr(e?.message || "Error guardando estado");
      // Si falla, forzamos recarga para volver a verdad backend
      try {
        await load();
      } catch {}
    } finally {
      setSavingActionId(null);
    }
  }

  if (!valid) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        Parámetros inválidos.
      </div>
    );
  }

  const progress = data?.progress;
  const pct = progress?.pct_done ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <button
          onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/programas`)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a programas
        </button>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">
              Checklist de ejecución
            </h1>
            <div className="mt-1 text-sm text-slate-600">
              Marca el estado de cada acción. Se guarda automáticamente.
            </div>
          </div>

          {progress ? (
            <div className="shrink-0 text-right">
              <div className="text-xs text-slate-500">Completado</div>
              <div className="mt-1 text-3xl font-bold text-slate-900">
                {pct}%
              </div>
            </div>
          ) : null}
        </div>

        {progress ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div>
                Hechas <b>{progress.done}</b> · En curso <b>{progress.in_progress}</b> · Pendientes{" "}
                <b>{progress.todo}</b> · Total <b>{progress.total}</b>
              </div>
              <div className="text-slate-500">
                Iniciadas: <b>{progress.pct_started}%</b>
              </div>
            </div>

            <div className="mt-2 h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600"
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              />
            </div>
          </div>
        ) : null}

        {saveErr ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {saveErr}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Cargando acciones…
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          {err}
        </div>
      ) : (data?.items?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay acciones para este programa (todavía).
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {data!.items.map((a) => {
            const s: ActionStatus = (a.status ?? null);
            const busy = savingActionId === a.action_id;

            return (
              <div key={a.action_id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-xs text-slate-500 font-mono">
                        {a.action_code}
                      </div>
                      <span
                        className={[
                          "text-xs px-2.5 py-1 rounded-full border font-semibold",
                          statusPillClass(s),
                        ].join(" ")}
                        title="Estado actual"
                      >
                        {statusLabel(s)}
                      </span>
                      {busy ? (
                        <span className="text-xs text-slate-500">Guardando…</span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-base font-semibold text-slate-900">
                      {a.title}
                    </div>

                    {a.description ? (
                      <div className="mt-2 text-sm text-slate-600">
                        {a.description}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        Impacto {a.impact_score ?? "—"}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        Esfuerzo {a.effort_score ?? "—"}
                      </span>
                      {a.typical_duration_weeks ? (
                        <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                          {a.typical_duration_weeks} sem
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Toggles (backend-driven save) */}
                  <div className="shrink-0">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        disabled={busy}
                        onClick={() => setActionStatus(a.action_id, "todo")}
                        className={[
                          "px-3 py-2 text-xs font-semibold transition",
                          (s === null || s === "todo")
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        title="Pendiente"
                      >
                        Pendiente
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setActionStatus(a.action_id, "in_progress")}
                        className={[
                          "px-3 py-2 text-xs font-semibold transition border-l border-slate-200",
                          s === "in_progress"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        title="En curso"
                      >
                        En curso
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setActionStatus(a.action_id, "done")}
                        className={[
                          "px-3 py-2 text-xs font-semibold transition border-l border-slate-200",
                          s === "done"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        title="Hecho"
                      >
                        Hecho
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
