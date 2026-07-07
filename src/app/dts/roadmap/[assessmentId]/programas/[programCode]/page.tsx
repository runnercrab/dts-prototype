"use client";

// src/app/dts/roadmap/[assessmentId]/programas/[programCode]/page.tsx
//
// M3 · Ejecución mínima /dts — Pantalla de acciones de un programa.
// María abre un programa desde su roadmap y ve sus acciones completas; puede
// marcar/desmarcar cada acción y su progreso queda guardado.
//
// UI pura reutilizada de GapplyRoadmap.tsx (tarjetas de acción con checkbox +
// qué hacer / cómo hacerlo / para qué sirve / "Terminado cuando" / ejemplo +
// barra de progreso), SIN su esqueleto viejo: sin meses 30/60/90/backlog, sin
// capacidad, sin badges, sin SIGUIENTE/OPCIONAL, sin reasons/why_now, sin olas.
//
// Gating (disponibilidad del payload v3 manda): un programa con gate/no_medible
// (razon_ceo del motor, expuesta por la API roadmap como `why_now`) se muestra
// bloqueado con su explicación y SIN checkbox operativo.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ActionItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dod: string | null;
  que_hacer: string | null;
  como_hacerlo: string | null;
  para_que_sirve: string | null;
  entregable_concreto: string | null;
  ejemplo: string | null;
  status: string;
};

type RoadmapProgramLite = {
  program_code: string;
  title: string;
  why_now?: string;
};

export default function DtsProgramActionsPage() {
  const params = useParams<{ assessmentId: string; programCode: string }>();
  const assessmentId = useMemo(
    () => (params?.assessmentId || "").toString().trim(),
    [params]
  );
  const programCode = useMemo(
    () => decodeURIComponent((params?.programCode || "").toString().trim()),
    [params]
  );
  const valid = assessmentId && isUuid(assessmentId) && !!programCode;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [program, setProgram] = useState<RoadmapProgramLite | null>(null);
  const [foundInRoadmap, setFoundInRoadmap] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      setErr("Parámetros inválidos.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Gate/disponibilidad + nombre: del payload v3 (API roadmap existente).
        const [rmRes, acRes] = await Promise.all([
          fetch(`/api/dts/results/roadmap?assessmentId=${assessmentId}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/dts/roadmap/program-actions?assessmentId=${assessmentId}&programCode=${encodeURIComponent(
              programCode
            )}`,
            { cache: "no-store" }
          ),
        ]);

        const rmJson = await rmRes.json().catch(() => null);
        const acJson = await acRes.json().catch(() => null);

        if (!acRes.ok) {
          throw new Error(acJson?.error || `Error ${acRes.status} cargando acciones.`);
        }

        let prog: RoadmapProgramLite | null = null;
        if (rmRes.ok && rmJson?.phases) {
          for (const ph of rmJson.phases) {
            for (const p of ph.programs || []) {
              if (p.program_code === programCode) {
                prog = {
                  program_code: p.program_code,
                  title: p.title || p.program_code,
                  why_now: typeof p.why_now === "string" ? p.why_now : "",
                };
              }
            }
          }
        }

        if (!cancelled) {
          setFoundInRoadmap(!!prog);
          setProgram(prog);
          setActions(Array.isArray(acJson?.actions) ? acJson.actions : []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error desconocido.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, programCode, valid]);

  // gate del payload v3: why_now no-vacío ⟺ programa bloqueado/no_medible.
  const gated = !!(program && program.why_now && program.why_now.length > 0);
  const available = foundInRoadmap && !gated;

  const total = actions.length;
  const done = actions.filter((a) => a.status === "completed").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function toggle(a: ActionItem) {
    if (!available || saving[a.id]) return;
    const next = a.status === "completed" ? "pending" : "completed";
    // Optimista
    setActions((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status: next } : x))
    );
    setSaving((s) => ({ ...s, [a.id]: true }));
    try {
      const res = await fetch("/api/dts/roadmap/action-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, actionId: a.id, status: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        // revertir si falla
        setActions((prev) =>
          prev.map((x) => (x.id === a.id ? { ...x, status: a.status } : x))
        );
      }
    } catch {
      setActions((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, status: a.status } : x))
      );
    } finally {
      setSaving((s) => ({ ...s, [a.id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-6">
          <Link
            href={`/dts/roadmap/${assessmentId}`}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Volver al plan
          </Link>
          <div className="mt-3 text-sm font-mono text-slate-500">{programCode}</div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {program?.title || "Programa"}
          </h1>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Cargando acciones…
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            No se han podido cargar las acciones. {err}
          </div>
        ) : gated ? (
          // Item 5: programa bloqueado/no_medible → sin ejecución activa.
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="text-sm font-bold uppercase tracking-widest text-amber-700">
              Todavía no disponible
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-amber-900">
              {program?.why_now}
            </p>
          </div>
        ) : !available ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Este programa no está disponible para ejecutar todavía.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progreso del programa */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Progreso</span>
                <span className="text-sm font-semibold text-slate-500">
                  {done} de {total} acciones
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct === 100 ? "#10b981" : "#1a90ff",
                  }}
                />
              </div>
            </div>

            {total === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
                Este programa no tiene acciones activas.
              </div>
            ) : (
              actions.map((a, idx) => {
                const isDone = a.status === "completed";
                const isOpen = openId === a.id;
                return (
                  <div
                    key={a.id}
                    className="overflow-hidden rounded-2xl border bg-white"
                    style={{ borderColor: isDone ? "#a7f3d0" : "#dde3eb" }}
                  >
                    <div className="flex items-center gap-4 p-5">
                      {/* Checkbox operativo */}
                      <button
                        type="button"
                        aria-label={isDone ? "Desmarcar" : "Marcar como hecha"}
                        onClick={() => toggle(a)}
                        disabled={!!saving[a.id]}
                        className="flex-shrink-0"
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
                          style={{
                            border: `2px solid ${isDone ? "#10b981" : "#cbd5e1"}`,
                            backgroundColor: isDone ? "#10b981" : "white",
                          }}
                        >
                          {isDone ? (
                            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M2.5 6L5 8.5L9.5 3.5"
                                stroke="white"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : a.id)}
                        className="flex flex-1 items-center justify-between gap-3 text-left"
                      >
                        <span
                          className={
                            "text-[17px] font-semibold leading-snug " +
                            (isDone ? "text-slate-400 line-through" : "text-slate-900")
                          }
                        >
                          {idx + 1}. {a.name}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className={"transition-transform " + (isOpen ? "rotate-180" : "")}
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    {isOpen ? (
                      <div
                        className="flex flex-col gap-4 px-5 pb-5"
                        style={{ borderTop: "1px solid #eef2f6" }}
                      >
                        {a.que_hacer ? (
                          <Field label="Qué hacer" strong>
                            {a.que_hacer}
                          </Field>
                        ) : null}
                        {a.como_hacerlo ? (
                          <Field label="Cómo hacerlo">{a.como_hacerlo}</Field>
                        ) : null}
                        {a.para_que_sirve ? (
                          <Field label="Para qué sirve">{a.para_que_sirve}</Field>
                        ) : null}
                        {a.entregable_concreto ? (
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                            <div className="text-[13px] font-bold text-emerald-600">
                              Terminado cuando
                            </div>
                            <p className="mt-1 text-[14px] leading-relaxed text-slate-700">
                              {a.entregable_concreto}
                            </p>
                          </div>
                        ) : null}
                        {!a.que_hacer && a.description ? (
                          <p className="text-[15px] leading-relaxed text-slate-700">
                            {a.description}
                          </p>
                        ) : null}
                        {a.ejemplo ? (
                          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[13px] leading-relaxed text-slate-700">
                            <span className="font-semibold">Ejemplo:</span> {a.ejemplo}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-bold text-slate-500">{label}</p>
      <p
        className={
          "text-[15px] leading-relaxed " +
          (strong ? "font-semibold text-slate-900" : "text-slate-700")
        }
      >
        {children}
      </p>
    </div>
  );
}
