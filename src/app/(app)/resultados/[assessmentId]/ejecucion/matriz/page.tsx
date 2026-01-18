"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type MatrixItem = {
  rank: number;
  program_id: string;
  program_code: string;
  dot_label: string;

  impact_score: number;
  effort_score: number;

  quadrant: "quick_win" | "transformational" | "foundation" | "maintenance";

  x_pct: number;
  y_pct: number;

  dot_bg: string;
  dot_ring: string;
  dot_text: string;
  dot_shadow: string;
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  plot: {
    margin_pct: number;
    axis_x_pct: number;
    axis_y_pct: number;
    rule?: any;
  };
  count: number;
  items: MatrixItem[];
};

export default function EjecucionMatrizPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
  const valid = assessmentId && isUuid(assessmentId);

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

        const url = `/api/dts/results/matriz?assessmentId=${assessmentId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Error cargando matriz");
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
  }, [assessmentId, valid]);

  if (!valid) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        assessmentId inválido.
      </div>
    );
  }

  const axisX = data?.plot?.axis_x_pct ?? 50;
  const axisY = data?.plot?.axis_y_pct ?? 50;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold text-slate-900">Mapa de decisión</div>
            <div className="mt-1 text-sm text-slate-600">
              X = <b>Esfuerzo</b> (bajo → alto) · Y = <b>Impacto</b> (bajo → alto)
            </div>
          </div>

          <button
            onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/programas`)}
            className="bg-white text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
          >
            Volver a programas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50">
          <div className="relative w-full h-[520px] overflow-hidden rounded-2xl">
            {/* Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(203,213,225,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(203,213,225,0.35) 1px, transparent 1px)",
                backgroundSize: "14.285% 20%",
              }}
            />

            {/* Axis lines (backend coords) */}
            <div className="absolute top-0 bottom-0 w-[2px] bg-slate-300" style={{ left: `${axisX}%` }} />
            <div className="absolute left-0 right-0 h-[2px] bg-slate-300" style={{ top: `${axisY}%` }} />

            {/* Labels */}
            <div className="absolute top-6 left-6 bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 font-semibold">
              Alto impacto · Bajo esfuerzo
            </div>
            <div className="absolute top-6 right-6 bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 font-semibold">
              Alto impacto · Alto esfuerzo
            </div>
            <div className="absolute bottom-6 left-6 bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 font-semibold">
              Bajo impacto · Bajo esfuerzo
            </div>
            <div className="absolute bottom-6 right-6 bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 font-semibold">
              Bajo impacto · Alto esfuerzo
            </div>

            {/* Loading / Error */}
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                Cargando…
              </div>
            ) : err ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 text-sm">
                  {err}
                </div>
              </div>
            ) : null}

            {/* Dots */}
            {!loading && !err && data?.items?.map((p) => (
              <button
                key={p.program_id}
                onClick={() => router.push(`/resultados/${assessmentId}/ejecucion/programas/${p.program_id}`)}
                title={`${p.program_code} (Impacto ${p.impact_score}, Esfuerzo ${p.effort_score})`}
                className={[
                  "absolute -translate-x-1/2 -translate-y-1/2",
                  "w-16 h-16 rounded-full",
                  "ring-8",
                  "flex items-center justify-center",
                  "font-extrabold text-sm",
                  "transition-transform hover:scale-105",
                  p.dot_bg,
                  p.dot_ring,
                  p.dot_text,
                  p.dot_shadow,
                ].join(" ")}
                style={{ left: `${p.x_pct}%`, top: `${p.y_pct}%` }}
              >
                {p.dot_label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          assessmentId: <span className="font-mono">{assessmentId}</span> · pack:{" "}
          <span className="font-mono">{data?.pack ?? "-"}</span> · programas:{" "}
          <b>{data?.count ?? 0}</b>
        </div>
      </div>
    </div>
  );
}
