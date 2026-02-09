"use client";

import { useEffect, useState } from "react";

type ProgramResults = {
  ok: true;
  program: {
    program_instance_id: string;
    title: string | null;
    status: string;
    wave: string | null;
    created_at: string;
    closed_at: string | null;
  };
  execution_metrics: {
    total_actions: number;
    todo: number;
    doing: number;
    done: number;
    started_pct: number;
    completion_pct: number;
  };
  actions: {
    action_id: string;
    title: string;
    status: string;
    position: number | null;
  }[];
};

export default function ProgramResultsClient({
  assessmentId,
  programInstanceId,
}: {
  assessmentId: string;
  programInstanceId: string;
}) {
  const [data, setData] = useState<ProgramResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/dts/execution/program-results", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ program_instance_id: programInstanceId }),
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error cargando resultados");

        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [programInstanceId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Cargando resultados del programa…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        {err ?? "No hay datos"}
      </div>
    );
  }

  const { program, execution_metrics, actions } = data;

  return (
    <div className="space-y-6">

      {/* HEADER CEO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          Resultados del programa
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-900">
          {program.title ?? "Programa sin título"}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border px-3 py-1 bg-slate-50">
            Estado: <b>{program.status}</b>
          </span>
          <span className="rounded-full border px-3 py-1 bg-slate-50">
            Ola: <b>{program.wave ?? "—"}</b>
          </span>
          <span className="rounded-full border px-3 py-1 bg-slate-50">
            Acciones: <b>{execution_metrics.total_actions}</b>
          </span>
        </div>
      </div>

      {/* MÉTRICAS CLAVE */}
      <div className="grid grid-cols-4 gap-4">
        <Metric label="Completadas" value={`${execution_metrics.completion_pct}%`} />
        <Metric label="Iniciadas" value={`${execution_metrics.started_pct}%`} />
        <Metric label="En curso" value={execution_metrics.doing} />
        <Metric label="Pendientes" value={execution_metrics.todo} />
      </div>

      {/* TABLA EJECUTIVA */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-900">
            Acciones ejecutadas
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Estado real del plan (read-only).
          </p>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-4 py-3 w-[80px]">Orden</th>
                <th className="text-left px-4 py-3">Acción</th>
                <th className="text-left px-4 py-3 w-[160px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.action_id} className="border-t">
                  <td className="px-4 py-3 text-slate-500">
                    {a.position ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {a.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-xs text-slate-500">
            Nota: esta vista es solo lectura. La ejecución se gestiona desde Seguimiento.
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "done"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : status === "doing"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-slate-50 border-slate-200 text-slate-700";

  const label =
    status === "done" ? "Cerrada" : status === "doing" ? "En curso" : "No iniciada";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
