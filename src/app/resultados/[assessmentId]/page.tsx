// src/app/resultados/[assessmentId]/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ResultsV1 = {
  assessment_id: string;
  pack: string;
  totals: {
    total_criteria: number;
    answered_criteria: number;
    completion_rate: number;
  };
  by_dimension: Array<{
    dimension_id: string;
    dimension_code: string;
    dimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
  by_subdimension: Array<{
    dimension_code: string;
    subdimension_id: string;
    subdimension_code: string;
    subdimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
};

function statusLabel(answered: number, total: number) {
  if (total <= 0) return "N/A";
  if (answered >= total) return "Completa ✅";
  if (answered > 0) return "Parcial ⚠️";
  return "Pendiente ⏳";
}

async function getBaseUrl() {
  // Next 16: headers() devuelve Promise -> hay que await
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    "localhost:3000";

  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function fetchResultsV1(assessmentId: string): Promise<ResultsV1> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/results/v1", baseUrl);
  url.searchParams.set("assessmentId", assessmentId);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Results API error ${res.status}: ${text}`);
  }

  return res.json();
}

export default async function ResultadosPage({
  params,
}: {
  // Next 16: params puede venir como Promise
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  if (!assessmentId || !isUuid(assessmentId)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Resultados del diagnóstico</h1>
        <p className="mt-2 text-sm text-slate-600">
          No se ha encontrado un identificador válido para este diagnóstico.
        </p>
      </div>
    );
  }

  let data: ResultsV1 | null = null;
  let errorMsg: string | null = null;

  try {
    data = await fetchResultsV1(assessmentId);
  } catch (e: any) {
    errorMsg = e?.message || "Error inesperado cargando resultados.";
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Resultados del diagnóstico</h1>
        <p className="mt-2 text-sm text-red-600">
          {errorMsg ?? "No hay datos disponibles."}
        </p>
      </div>
    );
  }

  const total = data.totals.total_criteria ?? 0;
  const evaluated = data.totals.answered_criteria ?? 0;
  const completionPct = Math.round(((data.totals.completion_rate ?? 0) * 100) as number);
  const completed = total > 0 && evaluated >= total;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Resultados del diagnóstico</h1>
        <p className="text-sm text-slate-600 mt-1">
          {completed
            ? "Diagnóstico completado: ya podemos mostrar conclusiones y próximos pasos."
            : "Diagnóstico en curso: faltan áreas por evaluar."}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Pack: <span className="font-mono">{data.pack}</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Áreas evaluadas</div>
          <div className="mt-1 text-2xl font-semibold">{total}</div>
          <div className="mt-1 text-xs text-slate-500">
            Aspectos clave analizados en total
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Diagnóstico completado</div>
          <div className="mt-1 text-2xl font-semibold">
            {completed ? "Sí ✅" : "No ⏳"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {completed ? "Listo para conclusiones" : "Aún faltan respuestas"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-600">Cobertura</div>
          <div className="mt-1 text-2xl font-semibold">{completionPct}%</div>
          <div className="mt-1 text-xs text-slate-500">
            Porcentaje del diagnóstico ya evaluado
          </div>
        </div>
      </div>

      {/* By dimension */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cobertura por áreas del negocio</h2>
            <p className="text-xs text-slate-500 mt-1">
              “Evaluados” significa cuántos aspectos del diagnóstico se han analizado (no es una nota ni una puntuación).
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="py-2 pr-4">Área</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Aspectos clave</th>
                <th className="py-2 pr-4">Evaluados</th>
                <th className="py-2 pr-0">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.by_dimension.map((d) => {
                const st = statusLabel(d.answered_criteria, d.total_criteria);
                return (
                  <tr key={d.dimension_id} className="border-b">
                    <td className="py-2 pr-4 font-mono">{d.dimension_code}</td>
                    <td className="py-2 pr-4">{d.dimension_name}</td>
                    <td className="py-2 pr-4">{d.total_criteria}</td>
                    <td className="py-2 pr-4">{d.answered_criteria}</td>
                    <td className="py-2 pr-0">{st}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* By subdimension */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Detalle por subárea</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-600">
              <tr className="border-b">
                <th className="py-2 pr-4">Área</th>
                <th className="py-2 pr-4">Subárea</th>
                <th className="py-2 pr-4">Tema</th>
                <th className="py-2 pr-4">Aspectos</th>
                <th className="py-2 pr-4">Evaluados</th>
                <th className="py-2 pr-0">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.by_subdimension.map((s) => {
                const st = statusLabel(s.answered_criteria, s.total_criteria);
                return (
                  <tr key={s.subdimension_id} className="border-b">
                    <td className="py-2 pr-4 font-mono">{s.dimension_code}</td>
                    <td className="py-2 pr-4 font-mono">{s.subdimension_code}</td>
                    <td className="py-2 pr-4">{s.subdimension_name}</td>
                    <td className="py-2 pr-4">{s.total_criteria}</td>
                    <td className="py-2 pr-4">{s.answered_criteria}</td>
                    <td className="py-2 pr-0">{st}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Nota: esto todavía mide “cobertura” (qué se ha evaluado). El siguiente paso es mostrar “qué significa”
          (brechas, prioridades y recomendaciones en lenguaje de negocio).
        </p>
      </div>
    </div>
  );
}
