"use client";

import { useMemo, useState } from "react";

type TrackingKPIs = {
  programs: number;
  need_total: number;
  actions_done: number;
  actions_total: number;
  need_unlocked: number;
  actions_validated: number;
  need_unlocked_pct: number;
};

type ActionRow = {
  rank: number;
  program_id: string;
  program_code: string;
  program_title: string;

  action_id: string;
  action_code: string;
  action_title: string;

  status: "not_started" | "doing" | "done";
  owner: string | null;
  start_date: string | null; // YYYY-MM-DD
  due_date: string | null; // YYYY-MM-DD

  impact_validated: boolean;
  impact_validated_at: string | null;
  impact_validation_notes: string | null;

  is_overdue: boolean;
};

type OverviewResponse =
  | { ok: true; requestId: string; assessmentId: string; kpis: TrackingKPIs }
  | { ok: false; requestId?: string; error: string; details?: any };

type ActionsResponse =
  | {
      ok: true;
      requestId: string;
      assessmentId: string;
      onlyTop: boolean;
      meta: {
        total_rows: number;
        returned_rows: number;
        limit: number;
        offset: number;
        only_top: boolean;
      };
      rows: ActionRow[];
    }
  | { ok: false; requestId?: string; error: string; details?: any };

type ValidateImpactBody = {
  assessmentId: string;
  actionId: string;
  validated: boolean;
  validatedBy?: string | null;
  notes?: string | null;
};

type ValidateImpactResponse =
  | {
      ok: true;
      requestId: string;
      assessmentId: string;
      actionId: string;
      validated: boolean;
      result: any;
      kpis: TrackingKPIs | null;
      row: ActionRow | null;
    }
  | { ok: false; requestId?: string; error: string; payload?: any; details?: any };

type SetStatusBody = {
  assessmentId: string;
  actionId: string;
  status: "not_started" | "doing" | "done";
  owner?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  onlyTop?: boolean | null;
};

type SetStatusResponse =
  | {
      ok: true;
      requestId: string;
      assessmentId: string;
      actionId: string;
      status: "not_started" | "doing" | "done";
      result: any;
      kpis: TrackingKPIs | null;
      row: ActionRow | null;
    }
  | { ok: false; requestId?: string; error: string; payload?: any; details?: any };

function badgePriority(rank: number) {
  if (rank === 1) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (rank === 2) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function labelPriority(rank: number) {
  if (rank === 1) return "🟢 TOP";
  if (rank === 2) return "🟡 MEDIA";
  return "⚪ BAJA";
}

function statusLabel(s: ActionRow["status"]) {
  if (s === "not_started") return "No iniciada";
  if (s === "doing") return "En curso";
  return "Cerrada";
}

function statusPillClass(s: ActionRow["status"]) {
  if (s === "done") return "border-slate-200 bg-slate-100 text-slate-700";
  if (s === "doing") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-white text-slate-700";
}

export default function SeguimientoTrackingClient(props: {
  assessmentId: string;
  onlyTop: boolean;
  initialKpis: TrackingKPIs;
  initialRows: ActionRow[];
}) {
  const { assessmentId } = props;

  const [onlyTop, setOnlyTop] = useState<boolean>(props.onlyTop);
  const [kpis, setKpis] = useState<TrackingKPIs>(props.initialKpis);
  const [rows, setRows] = useState<ActionRow[]>(props.initialRows);

  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, { program_code: string; program_title: string; rows: ActionRow[] }[]>();
    // agrupamos por rank y dentro por programa
    const byProgram = new Map<string, { rank: number; program_code: string; program_title: string; rows: ActionRow[] }>();

    for (const r of rows) {
      const key = `${r.rank}__${r.program_code}`;
      if (!byProgram.has(key)) {
        byProgram.set(key, {
          rank: r.rank,
          program_code: r.program_code,
          program_title: r.program_title,
          rows: [],
        });
      }
      byProgram.get(key)!.rows.push(r);
    }

    const items = Array.from(byProgram.values()).sort((a, b) => a.rank - b.rank || a.program_code.localeCompare(b.program_code));

    for (const it of items) {
      if (!map.has(it.rank)) map.set(it.rank, []);
      map.get(it.rank)!.push({ program_code: it.program_code, program_title: it.program_title, rows: it.rows });
    }

    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [rows]);

  async function reloadAll(nextOnlyTop: boolean) {
    setGlobalError(null);

    const qs = new URLSearchParams({
      assessmentId,
      onlyTop: nextOnlyTop ? "1" : "0",
      limit: "200",
      offset: "0",
    }).toString();

    const [ovRes, actRes] = await Promise.all([
      fetch(`/api/dts/tracking/overview?assessmentId=${assessmentId}`, { cache: "no-store" }),
      fetch(`/api/dts/tracking/actions?${qs}`, { cache: "no-store" }),
    ]);

    const ovJson = (await ovRes.json().catch(() => null)) as OverviewResponse | null;
    const actJson = (await actRes.json().catch(() => null)) as ActionsResponse | null;

    if (!ovJson || ovJson.ok !== true) {
      setGlobalError(ovJson?.error || "No he podido cargar los KPIs.");
      return;
    }
    if (!actJson || actJson.ok !== true) {
      setGlobalError(actJson?.error || "No he podido cargar las acciones.");
      return;
    }

    setKpis(ovJson.kpis);
    setRows(actJson.rows);
  }

  async function onToggleOnlyTop(next: boolean) {
    setOnlyTop(next);
    await reloadAll(next);
  }

  function patchRow(nextRow: ActionRow | null) {
    if (!nextRow) return;
    setRows((prev) => prev.map((r) => (r.action_id === nextRow.action_id ? nextRow : r)));
  }

  async function setStatus(actionId: string, status: ActionRow["status"]) {
    setGlobalError(null);
    setBusyRowId(actionId);

    const body: SetStatusBody = {
      assessmentId,
      actionId,
      status,
      onlyTop,
    };

    const res = await fetch("/api/dts/tracking/actions/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as SetStatusResponse | null;

    setBusyRowId(null);

    if (!json || json.ok !== true) {
      setGlobalError(json?.error || "No he podido actualizar el estado.");
      return;
    }

    if (json.kpis) setKpis(json.kpis);
    patchRow(json.row);
  }

  async function validateImpact(actionId: string, validated: boolean) {
    setGlobalError(null);
    setBusyRowId(actionId);

    const body: ValidateImpactBody = {
      assessmentId,
      actionId,
      validated,
      validatedBy: "CEO",
      notes: validated ? "Validado: impacto confirmado y observable." : "Revisión: impacto pendiente de confirmación.",
    };

    const res = await fetch("/api/dts/tracking/actions/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as ValidateImpactResponse | null;

    setBusyRowId(null);

    if (!json || json.ok !== true) {
      setGlobalError(json?.error || "No he podido validar el impacto.");
      return;
    }

    if (json.kpis) setKpis(json.kpis);
    patchRow(json.row);
  }

  return (
    <div className="max-w-[1200px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
          <p className="mt-2 text-slate-600">
            Ejecución y evidencias: lo que está en plan, el estado real de cada acción y la validación de impacto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleOnlyTop(true)}
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold border",
              onlyTop ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
            ].join(" ")}
          >
            Solo TOP
          </button>
          <button
            onClick={() => onToggleOnlyTop(false)}
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold border",
              !onlyTop ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
            ].join(" ")}
          >
            Ver todo el plan
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Programas en plan</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{kpis.programs}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Acciones</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {kpis.actions_done}/{kpis.actions_total}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Impacto validado</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">{kpis.actions_validated}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Need desbloqueado</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">
            {kpis.need_unlocked} <span className="text-sm text-slate-500">({kpis.need_unlocked_pct}%)</span>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="text-sm font-semibold">Error</div>
          <div className="mt-1 text-sm">{globalError}</div>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-900">Acciones del plan</div>
          <div className="mt-1 text-xs text-slate-500">
            El front no calcula: solo muestra lo que dicta el motor (RPCs). Cambios = llamadas a backend + repaint.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold">Prioridad</th>
                <th className="text-left px-4 py-3 font-semibold">Programa</th>
                <th className="text-left px-4 py-3 font-semibold">Acción</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
                <th className="text-left px-4 py-3 font-semibold">Impacto</th>
                <th className="text-left px-4 py-3 font-semibold">Due</th>
              </tr>
            </thead>

            <tbody>
              {grouped.map(([rank, programs]) => {
                return programs.map((pg, idx) => {
                  // filas del programa
                  return pg.rows.map((r, i) => {
                    const showPriority = idx === 0 && i === 0; // solo en la primera fila del bloque rank
                    const showProgram = i === 0; // solo primera fila del programa

                    return (
                      <tr key={`${r.action_id}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 align-top">
                          {showPriority ? (
                            <span
                              className={[
                                "inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold",
                                badgePriority(rank),
                              ].join(" ")}
                            >
                              {labelPriority(rank)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {showProgram ? (
                            <div className="min-w-[260px]">
                              <div className="text-xs text-slate-500 font-semibold">{pg.program_code}</div>
                              <div className="text-sm font-semibold text-slate-900">{pg.program_title}</div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="min-w-[320px]">
                            <div className="text-xs text-slate-500 font-semibold">{r.action_code}</div>
                            <div className="text-slate-900">{r.action_title}</div>
                            {r.is_overdue && (
                              <div className="mt-1 text-xs text-rose-700 font-semibold">⚠️ Vencida</div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <span className={["text-xs px-2 py-1 rounded-full border font-semibold", statusPillClass(r.status)].join(" ")}>
                              {statusLabel(r.status)}
                            </span>

                            <select
                              value={r.status}
                              disabled={busyRowId === r.action_id}
                              onChange={(e) => setStatus(r.action_id, e.target.value as ActionRow["status"])}
                              className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm"
                            >
                              <option value="not_started">No iniciada</option>
                              <option value="doing">En curso</option>
                              <option value="done">Cerrada</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                "text-xs px-2 py-1 rounded-full border font-semibold",
                                r.impact_validated ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600",
                              ].join(" ")}
                            >
                              {r.impact_validated ? "Validado" : "Pendiente"}
                            </span>

                            <button
                              disabled={busyRowId === r.action_id}
                              onClick={() => validateImpact(r.action_id, !r.impact_validated)}
                              className={[
                                "rounded-xl px-3 py-2 text-sm font-semibold border",
                                r.impact_validated
                                  ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                  : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
                              ].join(" ")}
                            >
                              {r.impact_validated ? "Reabrir validación" : "Validar impacto"}
                            </button>
                          </div>

                          {r.impact_validation_notes && (
                            <div className="mt-2 text-xs text-slate-500">{r.impact_validation_notes}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="text-sm text-slate-700">{r.due_date ?? "—"}</div>
                        </td>
                      </tr>
                    );
                  });
                });
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-600">
                    No hay acciones en el plan (con el filtro actual).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 bg-white">
          <div className="text-xs text-slate-500">
            Regla Big4: <span className="font-semibold text-slate-700">cerrar acción</span> ≠{" "}
            <span className="font-semibold text-slate-700">validar impacto</span>. Son controles distintos.
          </div>
        </div>
      </div>
    </div>
  );
}
