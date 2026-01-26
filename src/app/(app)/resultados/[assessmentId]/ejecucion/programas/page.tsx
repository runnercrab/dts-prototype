"use client";

// src/app/(app)/resultados/[assessmentId]/ejecucion/programas/page.tsx
// ✅ CEO-friendly
// ✅ Frontend NO calcula nada: solo lee /results y dispara comandos.
// ✅ Si el backend devuelve items (ranking o catálogo), se puede activar.
// ✅ Si devuelve 0 items, el CEO recibe guía (no “pantalla muerta”).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type Contributor = {
  criteria_code: string;
  title: string;
  gap: number;
  importance: number;
  need_component: number;
};

type ProgramItem = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;

  impact_score: number | null;
  effort_score: number | null;
  weighted_need: number | null;
  program_score: number | null;
  criteria_covered: number | null;

  priority_badge: string | null;
  priority_reason: string | null;

  top_contributors: Contributor[] | null;
  top_contributors_share: number | null;

  status?: string | null;
};

type ApiResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: ProgramItem[];
  // (futuro) gate?: { required:number; answered:number; can_execute:boolean; ... }
  // (futuro) blocked?: boolean;
  // (futuro) reason?: string;
};

function getBadgeStyle(badge: string | null) {
  const b = (badge || "").toUpperCase();
  if (b.includes("TOP") || b.includes("🟢")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Prioridad alta",
      icon: "🟢",
    };
  }
  if (b.includes("MEDIA") || b.includes("🟡")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "Prioridad media",
      icon: "🟡",
    };
  }
  return {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Prioridad normal",
    icon: "⚪",
  };
}

function getImpactLabel(score: number | null): string {
  if (score === null) return "—";
  if (score >= 4) return "Alto";
  if (score >= 3) return "Medio";
  return "Bajo";
}

function getEffortLabel(score: number | null): string {
  if (score === null) return "—";
  if (score <= 2) return "Bajo";
  if (score <= 3) return "Medio";
  return "Alto";
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

  if (!res.ok) {
    const msg = (data as any)?.error ? String((data as any).error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (data.ok === false) throw new Error(String(data.error));
  return data;
}

export default function EjecucionProgramasPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
  const valid = assessmentId && isUuid(assessmentId);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activateErr, setActivateErr] = useState<string | null>(null);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/dts/results/programs?assessmentId=${assessmentId}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error((json as any)?.error || "Error cargando programas");
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

  const hasItems = (data?.items?.length ?? 0) > 0;
  const packLabel = data?.pack ? String(data.pack) : "—";

  async function onActivate(programId: string) {
    setActivateErr(null);
    setActivatingId(programId);

    try {
      const resp = await postActivateProgram({ assessmentId, programId });

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
        <h1 className="text-2xl font-bold text-slate-900">Qué frentes abordar primero</h1>
        <p className="mt-2 text-slate-600">
          Cada programa agrupa acciones relacionadas para resolver un problema concreto.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/resultados/${assessmentId}/ejecucion/roadmap`}
            className="inline-flex items-center px-5 py-2.5 bg-blue-800 text-white rounded-xl font-semibold text-sm hover:bg-blue-900 transition"
          >
            Ver roadmap por olas
          </Link>
          <Link
            href={`/resultados/${assessmentId}/ejecucion/matriz`}
            className="inline-flex items-center px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
          >
            Ver matriz
          </Link>
        </div>

        {!loading && !err && !hasItems ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-900">Ejecución aún no disponible</div>

            <p className="mt-1 text-sm text-amber-800">
              El diagnóstico parece estar completado, pero el backend ha devuelto{" "}
              <b>0 programas</b> para el pack <span className="font-mono">{packLabel}</span>.
            </p>

            <p className="mt-2 text-sm text-amber-800">
              Esto suele indicar <b>falta de catálogo/mapeo pack→programas</b> (o un filtro incorrecto en el RPC/route de Programas).
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/resultados/${assessmentId}`}
                className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition"
              >
                Volver a Resultados
              </Link>

              <Link
                href={`/diagnostico-full?assessmentId=${assessmentId}`}
                className="inline-flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
              >
                Ver / completar diagnóstico
              </Link>

              <Link
                href={`/resultados/${assessmentId}/frenos`}
                className="inline-flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
              >
                Revisar frenos
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-semibold text-blue-900">Qué decisión se te pide aquí</div>
            <p className="mt-1 text-sm text-blue-800">
              Elige un programa y pulsa “Iniciar programa”. Eso crea el plan de ejecución para poder hacer
              seguimiento de acciones.
            </p>
          </div>
        )}

        {activateErr ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
            <div className="text-sm font-semibold">No se ha podido iniciar</div>
            <div className="mt-1 text-sm">{activateErr}</div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-slate-600">Cargando programas…</p>
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">{err}</div>
        ) : !hasItems ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No hay programas disponibles desde backend para mostrar.
          </div>
        ) : (
          data!.items.map((p) => {
            const badge = getBadgeStyle(p.priority_badge);
            const impactLabel = getImpactLabel(p.impact_score);
            const effortLabel = getEffortLabel(p.effort_score);
            const isActivating = activatingId === p.program_id;

            return (
              <div
                key={p.program_id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text} ${badge.border} border`}
                      >
                        {badge.icon} {badge.label}
                      </span>

                      <h2 className="mt-3 text-xl font-bold text-slate-900">{p.title}</h2>

                      {p.priority_reason ? (
                        <p className="mt-2 text-slate-600">{p.priority_reason}</p>
                      ) : (
                        <p className="mt-2 text-slate-600">Programa recomendado por el backend.</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-4xl font-bold text-slate-900">
                        {p.program_score != null ? p.program_score.toFixed(0) : "—"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">puntos</div>
                    </div>
                  </div>

                  {p.top_contributors && p.top_contributors.length > 0 ? (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Qué está empujando este problema</div>
                      <p className="mt-1 text-sm text-slate-600 mb-3">
                        Criterios del diagnóstico que más contribuyen a este programa:
                      </p>

                      <div className="space-y-2">
                        {p.top_contributors.slice(0, 3).map((c) => (
                          <div key={c.criteria_code} className="flex items-start gap-2 text-sm">
                            <span className="text-slate-400">•</span>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800">{c.title}</span>
                              <span className="text-slate-500 ml-2">({c.criteria_code})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>
                      Impacto <span className="font-semibold text-slate-700">{impactLabel}</span>
                    </span>
                    <span>·</span>
                    <span>
                      Esfuerzo <span className="font-semibold text-slate-700">{effortLabel}</span>
                    </span>
                    {p.criteria_covered != null ? (
                      <>
                        <span>·</span>
                        <span>{p.criteria_covered} criterios afectados</span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isActivating}
                      onClick={() => onActivate(p.program_id)}
                      className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition disabled:opacity-50"
                      title="Crea el plan de ejecución y habilita Seguimiento"
                    >
                      {isActivating ? "Iniciando…" : "Iniciar programa"}
                    </button>

                    <Link
                      href={`/resultados/${assessmentId}/ejecucion/roadmap`}
                      className="inline-flex items-center px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                      title="Ver el programa dentro del plan por olas"
                    >
                      Ver en Roadmap
                    </Link>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Al iniciar, se crea el plan de ejecución para poder ver acciones en Seguimiento.
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
        <Link
          href={`/resultados/${assessmentId}`}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a resultados
        </Link>
        <Link
          href={`/resultados/${assessmentId}/frenos`}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Revisar frenos detectados
        </Link>
      </div>
    </div>
  );
}
