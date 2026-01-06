// src/app/resultados/[assessmentId]/frenos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type FrenoItem = {
  rank: number;
  criterion_code: string;
  title: string;
  plain_impact: string; // CEO-friendly
  symptom: string;
  suggested_action: string;
  impact_score: number; // 1..5 (para matriz)
  effort_score: number; // 1..5 (para matriz)
  note?: string; // para “demo/no basado aún”
};

type FrenosResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: FrenoItem[];
  disclaimer?: string;
};

export default function FrenosPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    const v = (params?.assessmentId || "").toString().trim();
    return v;
  }, [params]);

  const [data, setData] = useState<FrenosResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErrorMsg(null);
      setData(null);

      if (!assessmentId || !isUuid(assessmentId)) {
        setLoading(false);
        setErrorMsg("assessmentId inválido.");
        return;
      }

      try {
        const res = await fetch(
          `/api/dts/results/frenos?assessmentId=${encodeURIComponent(assessmentId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`API error ${res.status}: ${text || "sin detalle"}`);
        }

        const json = (await res.json()) as FrenosResponse;
        if (!alive) return;
        setData(json);
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message || "Error cargando frenos.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Frenos del negocio</h1>
        <p className="mt-2 text-sm text-slate-600">Cargando…</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-2xl font-semibold">Frenos del negocio</h1>
          <p className="mt-2 text-sm text-red-700">{errorMsg ?? "No hay datos."}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.back()}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              Volver
            </button>
            <a
              href={`/resultados/${assessmentId}`}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              Ir a Resultados
            </a>
          </div>
        </div>
      </div>
    );
  }

  const completedText = data.disclaimer ? (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="font-semibold">Nota</div>
      <div className="mt-1">{data.disclaimer}</div>
    </div>
  ) : null;

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Frenos del negocio</h1>
        <p className="text-slate-600">
          Aquí están los <span className="font-semibold">{data.count}</span> puntos que hoy
          frenan más el progreso (lenguaje CEO, sin jerga).
        </p>
        {completedText}
      </header>

      {/* KPI mini */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-slate-600">Pack</div>
          <div className="mt-1 font-mono text-sm">{data.pack}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-slate-600">Frenos detectados</div>
          <div className="mt-1 text-2xl font-semibold">{data.count}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-slate-600">Siguiente paso</div>
          <a
            className="mt-1 inline-block text-sm font-semibold text-blue-600 hover:underline"
            href={`/resultados/${assessmentId}/matriz`}
          >
            Construir matriz Impacto/Esfuerzo →
          </a>
          <div className="text-xs text-slate-500 mt-1">(si esa pantalla existe ya)</div>
        </div>
      </div>

      {/* Lista CEO-ready */}
      <div className="rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Los {data.count} frenos (uno por uno)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cada freno viene con: impacto en negocio, síntoma típico y una acción sugerida.
        </p>

        <div className="mt-4 space-y-3">
          {data.items.map((it) => (
            <div key={it.rank} className="rounded-2xl border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl border flex items-center justify-center font-semibold">
                    {it.rank}
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-mono">
                      {it.criterion_code}
                    </div>
                    <div className="text-base font-semibold">{it.title}</div>
                  </div>
                </div>

                <div className="flex gap-2 text-xs">
                  <span className="rounded-full border px-2 py-1">
                    Impacto: <b>{it.impact_score}/5</b>
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Esfuerzo: <b>{it.effort_score}/5</b>
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 border p-3">
                  <div className="text-slate-600">Impacto (en negocio)</div>
                  <div className="mt-1">{it.plain_impact}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border p-3">
                  <div className="text-slate-600">Síntoma típico</div>
                  <div className="mt-1">{it.symptom}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border p-3">
                  <div className="text-slate-600">Acción sugerida</div>
                  <div className="mt-1">{it.suggested_action}</div>
                </div>
              </div>

              {it.note ? (
                <div className="mt-3 text-xs text-amber-700">
                  ⚠️ {it.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`/resultados/${assessmentId}`}
          className="rounded-xl border px-4 py-3 text-sm text-center"
        >
          Volver a Resultados
        </a>
        <a
          href={`/resultados/${assessmentId}/matriz`}
          className="rounded-xl bg-blue-600 text-white px-4 py-3 text-sm text-center"
        >
          Matriz Impacto/Esfuerzo →
        </a>
      </div>
    </div>
  );
}
