"use client";

import { useEffect, useMemo, useState } from "react";

type ProgramInstance = {
  id: string;
  assessment_id: string;
  program_id: string;
  title: string | null;
  status: string | null;
  wave: string | null;
};

type SeguimientoItem = {
  program_instance_id: string;
  action_id: string;
  title: string;
  status: string; // todo | doing | done
  position: number | null;
};

type ApiOk = {
  ok: true;
  assessment_id: string;
  program_instance: ProgramInstance | null;
  count: number;
  items: SeguimientoItem[];
};

type ApiErr = {
  ok: false;
  error: string;
  details?: string | null;
};

type ApiResponse = ApiOk | ApiErr;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error cargando datos");
  return data as T;
}

async function updateStatus(params: {
  assessment_id: string;
  program_instance_id: string;
  action_id: string;
  status: string;
}) {
  const res = await fetch("/api/dts/results/action-status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data?.error || "Error guardando estado");
  }
}

function label(status: string) {
  if (status === "done") return "Cerrada";
  if (status === "doing") return "En curso";
  return "No iniciada";
}

export default function SeguimientoClient({ assessmentId }: { assessmentId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [rowErr, setRowErr] = useState<Record<string, string | null>>({});

  async function load() {
    setLoading(true);
    try {
      const resp = await fetchJson<ApiResponse>(
        `/api/dts/results/seguimiento?assessmentId=${assessmentId}`
      );
      setData(resp);
    } catch (e: any) {
      setData({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [assessmentId]);

  const ok = data && data.ok ? data : null;
  const items = useMemo(
    () => [...(ok?.items || [])].sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999)),
    [ok]
  );

  async function onChangeStatus(it: SeguimientoItem, newStatus: string) {
    setRowErr((p) => ({ ...p, [it.action_id]: null }));
    setSaving((p) => ({ ...p, [it.action_id]: true }));

    try {
      await updateStatus({
        assessment_id: assessmentId,
        program_instance_id: it.program_instance_id,
        action_id: it.action_id,
        status: newStatus,
      });

      await load(); // 👈 backend manda
    } catch (e: any) {
      setRowErr((p) => ({ ...p, [it.action_id]: e.message }));
    } finally {
      setSaving((p) => ({ ...p, [it.action_id]: false }));
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
        Cargando seguimiento…
      </div>
    );
  }

  if (!data || data.ok === false) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
        Error cargando seguimiento
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Programa */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Programa en ejecución</div>
        <div className="mt-1 text-xl font-semibold">{ok.program_instance?.title || "—"}</div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Orden</th>
              <th className="px-4 py-3 text-left">Acción</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it.action_id} className="border-t">
                <td className="px-4 py-3 text-xs text-slate-500">
                  {it.position ?? "—"}
                </td>

                <td className="px-4 py-3 font-medium text-slate-900">
                  {it.title}
                  {rowErr[it.action_id] && (
                    <div className="mt-2 text-xs text-rose-700">
                      {rowErr[it.action_id]}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <select
                    value={it.status}
                    disabled={saving[it.action_id]}
                    onChange={(e) => onChangeStatus(it, e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="todo">No iniciada</option>
                    <option value="doing">En curso</option>
                    <option value="done">Cerrada</option>
                  </select>

                  <div className="mt-1 text-xs text-slate-500">
                    Estado actual: {label(it.status)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
