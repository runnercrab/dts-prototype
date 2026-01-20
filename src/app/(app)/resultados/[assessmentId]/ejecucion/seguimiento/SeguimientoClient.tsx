// src/app/(app)/resultados/[assessmentId]/ejecucion/seguimiento/SeguimientoClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TrackingOverviewResponse = {
  ok: true;
  requestId: string;
  assessmentId: string;
  kpis: {
    programs: number;
    need_total: number;
    actions_done: number;
    actions_total: number;
    need_unlocked: number;
    actions_validated: number;
    need_unlocked_pct: number;
  };
};

type TrackingOverviewError = { ok: false; error: string; details?: string | null };

type TrackingActionRow = {
  rank: number;
  program_id: string;
  program_code: string;
  program_title: string;

  action_id: string;
  action_code: string;
  action_title: string;

  status: string;
  owner: string | null;
  start_date: string | null;
  due_date: string | null;

  impact_validated: boolean;
  impact_validated_at: string | null;
  impact_validation_notes: string | null;

  is_overdue: boolean;
};

type TrackingActionsResponse = {
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
  rows: TrackingActionRow[];
};

type TrackingActionsError = { ok: false; error: string; details?: string | null };

type ValidateImpactResponse = {
  ok: true;
  requestId: string;
  assessmentId: string;
  actionId: string;
  validated: boolean;
  result: any; // rpc jsonb
  kpis: TrackingOverviewResponse["kpis"] | null;
  row?: TrackingActionRow | null;
};

type UpdateActionResponse = {
  ok: true;
  requestId: string;
  assessmentId: string;
  actionId: string;
  result: any; // rpc jsonb
  kpis: TrackingOverviewResponse["kpis"] | null;
  row?: TrackingActionRow | null;
};

function badgePriority(rank: number) {
  if (rank <= 8) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (rank <= 18) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}
function labelPriority(rank: number) {
  if (rank <= 8) return "🟢 TOP";
  if (rank <= 18) return "🟡 MEDIA";
  return "⚪ BAJA";
}

function badgeStatus(status: string) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "doing") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-white text-slate-700";
}
function labelStatus(status: string) {
  if (status === "done") return "Cerrada";
  if (status === "doing") return "En curso";
  return "No iniciada";
}

function fmtDate(d: string | null) {
  return d ?? "—";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Invalid JSON (HTTP ${res.status})`);
  if (!res.ok) {
    const msg = data?.error ? String(data.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

async function postValidateImpact(params: {
  assessmentId: string;
  actionId: string;
  validated: boolean;
  validatedBy?: string;
  notes?: string | null;
}) {
  const res = await fetch("/api/dts/tracking/actions/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Invalid JSON (HTTP ${res.status})`);

  if (!res.ok || !data?.ok) {
    const msg = data?.error ? String(data.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as ValidateImpactResponse;
}

async function postUpdateAction(params: {
  assessmentId: string;
  actionId: string;
  status?: string | null;
  owner?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const res = await fetch("/api/dts/tracking/actions/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Invalid JSON (HTTP ${res.status})`);

  if (!res.ok || !data?.ok) {
    const msg = data?.error ? String(data.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as UpdateActionResponse;
}

function ImpactControl(props: {
  assessmentId: string;
  row: TrackingActionRow;
  onChanged: (resp: ValidateImpactResponse) => void;
}) {
  const { assessmentId, row, onChanged } = props;

  const alreadyValidated = !!row.impact_validated;

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(
    alreadyValidated
      ? "Revocado: evidencia insuficiente o no observable."
      : "Validado: impacto confirmado y observable."
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = alreadyValidated ? "Revocar validación de impacto" : "Validación de impacto";
  const subtitle = alreadyValidated
    ? "Revoca la validación si no hay evidencia observable o si el impacto no se materializa."
    : "Confirma que el impacto de esta acción es real y observable (evidencia o señal clara).";

  async function submit() {
    setErr(null);
    setSaving(true);
    try {
      const resp = await postValidateImpact({
        assessmentId,
        actionId: row.action_id,
        validated: !alreadyValidated,
        validatedBy: "CEO",
        notes: notes?.trim() || null,
      });
      setOpen(false);
      onChanged(resp);
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando validación");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {alreadyValidated ? (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
          Impacto validado
        </span>
      ) : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen(true)}
        className={
          alreadyValidated
            ? "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            : "inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        }
      >
        {alreadyValidated ? "Revocar" : "Validar impacto"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-5">
              <div className="text-base font-semibold text-slate-900">{title}</div>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500">
                  {alreadyValidated ? "Motivo de revocación" : "Notas de validación"}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder={
                    alreadyValidated
                      ? "Ej: no hay KPI publicado / no hay dashboard / no hay owner / no hay evidencia."
                      : "Ej: KPI definido y publicado. Dashboard visible. Responsable asignado."
                  }
                />
                {err && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                    {err}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={submit}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : alreadyValidated ? "Confirmar revocación" : "Confirmar validación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RowDraft = {
  status: string;
  owner: string;
  due_date: string; // YYYY-MM-DD or ""
};

function normalizeRowToDraft(r: TrackingActionRow): RowDraft {
  return {
    status: (r.status || "not_started") === "todo" ? "not_started" : (r.status || "not_started"),
    owner: r.owner ?? "",
    due_date: r.due_date ?? "",
  };
}

function isDirty(r: TrackingActionRow, d: RowDraft) {
  const base = normalizeRowToDraft(r);
  return base.status !== d.status || base.owner !== d.owner || base.due_date !== d.due_date;
}

export default function SeguimientoClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();

  const [overview, setOverview] = useState<TrackingOverviewResponse | TrackingOverviewError | null>(null);
  const [actions, setActions] = useState<TrackingActionsResponse | TrackingActionsError | null>(null);
  const [loading, setLoading] = useState(true);

  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});
  const [rowErr, setRowErr] = useState<Record<string, string | null>>({});

  async function load() {
    setLoading(true);
    try {
      const o = await fetchJson<TrackingOverviewResponse>(
        `/api/dts/tracking/overview?assessmentId=${assessmentId}`
      );
      setOverview(o);

      const a = await fetchJson<TrackingActionsResponse>(
        `/api/dts/tracking/actions?assessmentId=${assessmentId}&onlyTop=1&limit=200&offset=0`
      );
      setActions(a);

      // inicializa drafts desde backend (pinta tal cual)
      const rows = (a as any)?.rows as TrackingActionRow[] | undefined;
      if (rows?.length) {
        const next: Record<string, RowDraft> = {};
        for (const r of rows) next[r.action_id] = normalizeRowToDraft(r);
        setDrafts(next);
      } else {
        setDrafts({});
      }
    } catch (e: any) {
      setOverview({ ok: false, error: "No he podido cargar el overview", details: e?.message ?? null });
      setActions({ ok: false, error: "No he podido cargar las acciones", details: e?.message ?? null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const grouped = useMemo(() => {
    const rows = (actions as any)?.rows as TrackingActionRow[] | undefined;
    if (!rows?.length) return [];

    const map = new Map<
      string,
      {
        rank: number;
        program_code: string;
        program_title: string;
        rows: TrackingActionRow[];
      }
    >();

    for (const r of rows) {
      const key = r.program_code;
      if (!map.has(key)) {
        map.set(key, {
          rank: r.rank,
          program_code: r.program_code,
          program_title: r.program_title,
          rows: [],
        });
      }
      map.get(key)!.rows.push(r);
    }

    return Array.from(map.values()).sort((a, b) => a.rank - b.rank || a.program_code.localeCompare(b.program_code));
  }, [actions]);

  function patchFromBackend(resp: { kpis: any; row?: TrackingActionRow | null; actionId: string }) {
    // KPIs
    if (resp?.kpis && overview && (overview as any).ok !== false) {
      setOverview({
        ...(overview as TrackingOverviewResponse),
        kpis: resp.kpis,
      });
    }

    // Row
    if (resp?.row && actions && (actions as any).ok !== false) {
      const current = actions as TrackingActionsResponse;
      const nextRows = current.rows.map((r) => (r.action_id === resp.actionId ? (resp.row as TrackingActionRow) : r));
      setActions({ ...current, rows: nextRows });

      // actualiza draft baseline para que deje de estar "dirty"
      setDrafts((prev) => ({
        ...prev,
        [resp.actionId]: normalizeRowToDraft(resp.row as TrackingActionRow),
      }));
    } else {
      load();
    }

    router.refresh();
  }

  async function saveRow(r: TrackingActionRow) {
    const d = drafts[r.action_id] ?? normalizeRowToDraft(r);
    setRowErr((prev) => ({ ...prev, [r.action_id]: null }));
    setSavingRow((prev) => ({ ...prev, [r.action_id]: true }));

    try {
      const resp = await postUpdateAction({
        assessmentId,
        actionId: r.action_id,
        status: d.status,
        owner: d.owner || null,
        dueDate: d.due_date || null,
      });

      patchFromBackend({ ...resp, actionId: r.action_id });
    } catch (e: any) {
      setRowErr((prev) => ({ ...prev, [r.action_id]: e?.message ?? "Error guardando cambios" }));
    } finally {
      setSavingRow((prev) => ({ ...prev, [r.action_id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
        Cargando seguimiento ejecutivo…
      </div>
    );
  }

  if (overview && (overview as any).ok === false) {
    const e = overview as TrackingOverviewError;
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
        <div className="text-sm font-semibold">Error</div>
        <div className="mt-1 text-sm">
          {e.error} {e.details ? `— ${e.details}` : ""}
        </div>
      </div>
    );
  }

  const okOverview = overview as TrackingOverviewResponse;
  const k = okOverview?.kpis;

  return (
    <div className="space-y-6">
      {/* KPI strip (ejecutivo) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Indicadores</div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Programas</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.programs ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Acciones</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.actions_total ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Cerradas</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.actions_done ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Impacto validado</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.actions_validated ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">Need desbloqueado</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.need_unlocked ?? 0}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">% desbloqueo</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{k?.need_unlocked_pct ?? 0}%</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Regla: el impacto se valida cuando existe evidencia observable (KPI, ritual, dashboard, responsable, cambio real).
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Tabla de acciones por programa (solo TOP para demo) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-900">Plan en ejecución (TOP)</div>
          <p className="mt-1 text-sm text-slate-600">
            Este listado está acotado a lo priorizado. Lo que no es TOP no se enseña en la demo.
          </p>
        </div>

        {!grouped.length ? (
          <div className="p-5 text-slate-600">No hay acciones en seguimiento (TOP).</div>
        ) : (
          <div className="p-5 space-y-6">
            {grouped.map((g) => (
              <div key={g.program_code} className="rounded-2xl border border-slate-200">
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500">{g.program_code}</span>
                      <span className={["text-xs px-2 py-0.5 rounded-full border", badgePriority(g.rank)].join(" ")}>
                        {labelPriority(g.rank)}
                      </span>
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{g.program_title}</div>
                    <div className="mt-1 text-xs text-slate-500">{g.rows.length} acciones</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/programas`)}
                    className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    title="Abrir el detalle desde Programas"
                  >
                    Abrir en Programas
                  </button>
                </div>

                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="min-w-[1050px] w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left font-semibold px-4 py-3 w-[110px]">Acción</th>
                        <th className="text-left font-semibold px-4 py-3">Título</th>
                        <th className="text-left font-semibold px-4 py-3 w-[160px]">Estado</th>
                        <th className="text-left font-semibold px-4 py-3 w-[220px]">Owner</th>
                        <th className="text-left font-semibold px-4 py-3 w-[140px]">Due</th>
                        <th className="text-left font-semibold px-4 py-3 w-[220px]">Impacto</th>
                        <th className="text-right font-semibold px-4 py-3 w-[240px]">Control</th>
                      </tr>
                    </thead>

                    <tbody>
                      {g.rows.map((r) => {
                        const d = drafts[r.action_id] ?? normalizeRowToDraft(r);
                        const dirty = isDirty(r, d);
                        const saving = !!savingRow[r.action_id];
                        const err = rowErr[r.action_id];

                        return (
                          <tr key={r.action_id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-3 text-xs font-semibold text-slate-500">{r.action_code}</td>

                            <td className="px-4 py-3 text-slate-900">
                              <div className="font-medium">{r.action_title}</div>
                              {r.is_overdue ? (
                                <div className="mt-1 text-xs font-semibold text-rose-700">Vencida</div>
                              ) : null}
                              {err ? (
                                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
                                  {err}
                                </div>
                              ) : null}
                            </td>

                            {/* Estado (editable) */}
                            <td className="px-4 py-3">
                              <select
                                value={d.status}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [r.action_id]: { ...d, status: e.target.value },
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                              >
                                <option value="not_started">No iniciada</option>
                                <option value="doing">En curso</option>
                                <option value="done">Cerrada</option>
                              </select>

                              <div className="mt-2">
                                <span className={["text-xs px-2 py-1 rounded-full border", badgeStatus(r.status)].join(" ")}>
                                  Estado actual: {labelStatus(r.status)}
                                </span>
                              </div>
                            </td>

                            {/* Owner (editable) */}
                            <td className="px-4 py-3">
                              <input
                                value={d.owner}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [r.action_id]: { ...d, owner: e.target.value },
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                                placeholder="Ej: CEO / COO / Operaciones"
                              />
                              <div className="mt-2 text-xs text-slate-500">Owner actual: {r.owner ?? "—"}</div>
                            </td>

                            {/* Due (editable) */}
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={d.due_date}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [r.action_id]: { ...d, due_date: e.target.value },
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                              />
                              <div className="mt-2 text-xs text-slate-500">Due actual: {fmtDate(r.due_date)}</div>
                            </td>

                            {/* Impacto */}
                            <td className="px-4 py-3">
                              {r.impact_validated ? (
                                <div>
                                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                                    Validado
                                  </span>
                                  {r.impact_validation_notes ? (
                                    <div className="mt-1 text-xs text-slate-500">{r.impact_validation_notes}</div>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                                  Pendiente
                                </span>
                              )}
                            </td>

                            {/* Control */}
                            <td className="px-4 py-3 text-right space-y-2">
                              <div className="flex justify-end">
                                <ImpactControl
                                  assessmentId={assessmentId}
                                  row={r}
                                  onChanged={(resp) => patchFromBackend({ ...resp, actionId: r.action_id })}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={!dirty || saving}
                                  onClick={() => saveRow(r)}
                                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                                >
                                  {saving ? "Guardando..." : "Guardar"}
                                </button>

                                <button
                                  type="button"
                                  disabled={!dirty || saving}
                                  onClick={() =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [r.action_id]: normalizeRowToDraft(r),
                                    }))
                                  }
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-40"
                                >
                                  Descartar
                                </button>
                              </div>

                              {dirty ? (
                                <div className="text-[11px] text-slate-500 text-right">Cambios pendientes</div>
                              ) : (
                                <div className="text-[11px] text-slate-400 text-right">Sin cambios</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
