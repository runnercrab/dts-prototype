"use client"
import { useState, useMemo, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import ActionFormPanel from "./ActionFormPanel"

// ── Types ──────────────────────────────────────────────

interface RoadmapAction {
  id: string
  code: string
  name: string
  description: string | null
  deliverable: string | null
  dod: string | null
  band: string | null
  hours: number
  hours_min: number | null
  hours_typical: number | null
  hours_max: number | null
  month: string | null
  status: string
}

interface RoadmapProgram {
  id: string
  code: string
  name: string
  dimension: string
  tier: number | string
  dolor_ceo: string | null
  why_matters: string | null
  weighted_need: number
  program_score: number
  priority_badge: string | null
  reasons: string[]
  hours_typical: number | null
  actions: {
    "30d": RoadmapAction[]
    "60d": RoadmapAction[]
    "90d": RoadmapAction[]
    backlog: RoadmapAction[]
  }
}

interface CapacityPhase { limit: number; used: number }
interface D5Dimension { dimension: string; criteria: string[] }
interface CapacityExcess { "30d": number; "60d": number; "90d": number; total: number }

interface GapplyRoadmapProps {
  programs: RoadmapProgram[]
  capacity: { "30d": CapacityPhase; "60d": CapacityPhase; "90d": CapacityPhase }
  d5: D5Dimension[]
  capacityExceeded?: boolean
  capacityExcessHours?: CapacityExcess
  starterActionsForced?: number
  onStatusChange?: (id: string, s: "pending" | "completed") => void
  loading?: boolean
  // V2.2+
  supabase?: SupabaseClient
  assessmentId?: string
  demoToken?: string | null
  structuredActions?: Set<string>
}

const B = "#1a90ff"
const MONTH_LABELS: Record<string, string> = { "30d": "Mes 1", "60d": "Mes 2", "90d": "Mes 3", backlog: "Después" }
const MONTH_ORDER = ["30d", "60d", "90d", "backlog"] as const

const DIM_LABELS: Record<string, string> = {
  EST: "Estrategia", OPE: "Operaciones", PER: "Personas", DAT: "Datos",
  TEC: "Tecnología", GOB: "Gobierno", strategy: "Estrategia", operations: "Operaciones",
  culture: "Personas", data: "Datos", technology: "Tecnología", governance: "Gobierno", customer: "Cliente",
}

const BAND_LABELS: Record<string, { label: string; color: string }> = {
  XS: { label: "XS", color: "#10b981" }, S: { label: "S", color: "#10b981" },
  M: { label: "M", color: "#f59e0b" }, "M+": { label: "M+", color: "#f59e0b" },
  L: { label: "L", color: "#ef4444" }, R: { label: "R", color: "#8b5cf6" },
  C: { label: "C", color: "#8b5cf6" }, P: { label: "P", color: "#6366f1" },
}

const totalActions = (p: RoadmapProgram) => MONTH_ORDER.reduce((s, k) => s + (p.actions[k]?.length || 0), 0)
const totalHours = (p: RoadmapProgram) => MONTH_ORDER.reduce((s, k) => s + (p.actions[k] || []).reduce((h, a) => h + a.hours, 0), 0)
const cleanName = (n: string) => n.replace(/^\d+\.\s*/, "")

// ── Main ──

export default function GapplyRoadmap({
  programs, capacity, d5, capacityExceeded = false, capacityExcessHours,
  starterActionsForced = 0, onStatusChange, loading = false,
  supabase, assessmentId, demoToken, structuredActions,
}: GapplyRoadmapProps) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [openFormAction, setOpenFormAction] = useState<string | null>(null)

  const programsWithOverrides = useMemo(() => {
    if (!Object.keys(statusOverrides).length) return programs
    return programs.map(p => ({
      ...p,
      actions: Object.fromEntries(
        Object.entries(p.actions).map(([ph, acts]) => [ph, acts.map(a => ({ ...a, status: statusOverrides[a.id] || a.status }))])
      ) as RoadmapProgram["actions"],
    }))
  }, [programs, statusOverrides])

  const handleStatusToggle = useCallback((id: string, s: "pending" | "completed") => {
    setStatusOverrides(prev => ({ ...prev, [id]: s }))
    onStatusChange?.(id, s)
  }, [onStatusChange])

  const handleActionClick = useCallback((a: RoadmapAction) => {
    if (structuredActions?.has(a.code) && supabase && assessmentId) {
      setOpenFormAction(prev => prev === a.code ? null : a.code)
    } else {
      handleStatusToggle(a.id, a.status === "completed" ? "pending" : "completed")
    }
  }, [structuredActions, supabase, assessmentId, handleStatusToggle])

  const handleFormSaved = useCallback((actionCode: string) => {
    setOpenFormAction(null)
    for (const p of programs) {
      for (const phase of MONTH_ORDER) {
        const action = p.actions[phase]?.find(a => a.code === actionCode)
        if (action) {
          setStatusOverrides(prev => ({ ...prev, [action.id]: "completed" }))
          onStatusChange?.(action.id, "completed")
          return
        }
      }
    }
  }, [programs, onStatusChange])

  const all = programsWithOverrides
  const nProg = all.length
  const nAct = all.reduce((s, p) => s + totalActions(p), 0)
  const nHrs = all.reduce((s, p) => s + totalHours(p), 0)

  if (loading) return (
    <div>{[1,2,3].map(i => (
      <div key={i} className="bg-white rounded-2xl p-8 mb-4 opacity-60 animate-pulse" style={{ border: "1.5px solid #dde3eb" }}>
        <div className="h-6 bg-slate-200 rounded-lg w-3/5 mb-4" /><div className="h-5 bg-slate-100 rounded-lg w-2/5" />
      </div>
    ))}</div>
  )

  const sectionProps = { openProgramId, onToggleOpen: setOpenProgramId, onActionClick: handleActionClick, openFormAction, supabase, assessmentId, demoToken, structuredActions, onFormSaved: handleFormSaved, onFormClose: () => setOpenFormAction(null) }

  return (
    <div>
      {/* Header */}
      <div className="rounded-2xl p-7 md:p-10 mb-10" style={{ backgroundColor: "#f7f9fb", border: "1.5px solid #dde3eb" }}>
        <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-[family-name:var(--font-space-mono)]">Tu hoja de ruta priorizada</div>
        <p className="text-[20px] md:text-[24px] font-extrabold text-slate-900 leading-snug tracking-tight mb-3">Estas son las áreas que hoy más frenan el crecimiento de tu empresa.</p>
        <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed">Estos <strong>{nProg} programas</strong> están ordenados por impacto estructural. Cada uno agrupa acciones concretas distribuidas en 3 meses. Empieza por el <strong>#1</strong> y avanza en orden.</p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl mb-10 flex" style={{ border: "1.5px solid #dde3eb" }}>
        {[
          { value: nProg, label: "Programas", sub: "ordenados por impacto" },
          { value: nAct, label: "Acciones", sub: "distribuidas en 3 meses" },
          { value: nHrs + "h", label: "Esfuerzo estimado", sub: "horas de trabajo totales" },
        ].map((s, i) => (
          <div key={i} className="flex-1 text-center py-8 md:py-10" style={{ borderRight: i < 2 ? "1.5px solid #dde3eb" : "none" }}>
            <div className="text-[32px] md:text-[40px] font-extrabold leading-none" style={{ color: B }}>{s.value}</div>
            <div className="text-[16px] md:text-[18px] text-slate-800 mt-2 font-semibold">{s.label}</div>
            <div className="text-[14px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl px-7 md:px-10 py-6 mb-10 flex items-start gap-4" style={{ backgroundColor: "#e8f4ff", border: `1.5px solid ${B}30` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: B }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </div>
        <div>
          <p className="text-[16px] md:text-[18px] font-semibold text-slate-900">Empieza por los 3 primeros programas.</p>
          <p className="text-[15px] md:text-[16px] text-slate-600 mt-1 leading-relaxed">Son los que mayor impacto tienen en tu empresa según el diagnóstico. Cuando avances en ellos, continúa con los siguientes.</p>
        </div>
      </div>

      {/* ALL PROGRAMS — Single list ordered by impact */}
      <ProgramSection
        title="Tus programas"
        subtitle="Ordenados por el impacto que tienen en tu empresa según tu diagnóstico."
        programs={all}
        rankOffset={0}
        {...sectionProps}
      />

      {/* Legend */}
      <div className="mt-10 rounded-2xl p-7 md:p-10" style={{ backgroundColor: "#f7f9fb", border: "1.5px solid #dde3eb" }}>
        <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-5 font-[family-name:var(--font-space-mono)]">Cómo funciona</div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] font-extrabold text-white" style={{ backgroundColor: B }}>1</div>
              <span className="text-[15px] md:text-[16px] font-semibold text-slate-700">Prioridad</span>
            </div>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">Los programas están ordenados por impacto. Empieza por el #1 y avanza en orden.</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold uppercase tracking-wider font-[family-name:var(--font-space-mono)]" style={{ color: B }}>MES 1 · MES 2 · MES 3</span>
            </div>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">Las acciones de cada programa están distribuidas en 3 meses.</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: B }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span className="text-[15px] md:text-[16px] font-semibold text-slate-700">Marcar como hecho</span>
            </div>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">Haz clic en cada acción para registrar tu progreso o rellenar el formulario de las acciones clave.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ProgramSection — Single list, no base/expansion split
// ══════════════════════════════════════════════════════════

function ProgramSection({ title, subtitle, programs, openProgramId, onToggleOpen, onActionClick, rankOffset, openFormAction, supabase, assessmentId, demoToken, structuredActions, onFormSaved, onFormClose }: {
  title: string; subtitle: string
  programs: RoadmapProgram[]; openProgramId: string | null; onToggleOpen: (id: string | null) => void
  onActionClick: (a: RoadmapAction) => void; rankOffset: number; openFormAction: string | null
  supabase?: SupabaseClient; assessmentId?: string; demoToken?: string | null
  structuredActions?: Set<string>; onFormSaved: (code: string) => void; onFormClose: () => void
}) {
  return (
    <div className="mb-12">
      <h2 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight mb-2">{title}</h2>
      <p className="text-[16px] md:text-[18px] text-slate-500 mb-8 leading-relaxed">{subtitle}</p>

      <div className="flex flex-col gap-5">
        {programs.map((prog, i) => {
          const rank = rankOffset + i + 1, hrs = totalHours(prog), acts = totalActions(prog)
          const isOpen = openProgramId === prog.id, isTop3 = rank <= 3
          const dimLabel = DIM_LABELS[prog.dimension] || prog.dimension, name = cleanName(prog.name)

          return (
            <div key={prog.id} className={"bg-white rounded-2xl overflow-hidden transition-all " + (isOpen ? "shadow-md" : "hover:shadow-sm")}
              style={{ border: isOpen ? `2px solid ${B}` : isTop3 ? `1.5px solid ${B}50` : "1.5px solid #dde3eb" }}>

              {/* Header */}
              <div onClick={() => onToggleOpen(isOpen ? null : prog.id)} className="px-7 md:px-10 py-7 md:py-8 cursor-pointer"
                style={isTop3 && !isOpen ? { backgroundColor: "#fafcff" } : {}}>
                <div className="flex items-start gap-5 md:gap-6">
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px] font-extrabold"
                      style={isTop3 ? { backgroundColor: B, color: "white" } : { backgroundColor: "#f7f9fb", color: "#94a3b8", border: "1.5px solid #dde3eb" }}>
                      {rank}
                    </div>
                    {isTop3 && <span className="text-[10px] font-bold mt-1.5 uppercase tracking-wider font-[family-name:var(--font-space-mono)]" style={{ color: B }}>PRIORIDAD</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">{name}</h3>
                    {prog.dolor_ceo && <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed mb-2">{prog.dolor_ceo}</p>}
                    {rank === 1 && <p className="text-[12px] font-bold uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]" style={{ color: B }}>Mayor impacto detectado en tu diagnóstico</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-slate-400">{dimLabel}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[14px] text-slate-400 font-[family-name:var(--font-space-mono)]">{acts} acciones en 3 meses</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-1">
                    <span className="text-[16px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)]">{hrs}h</span>
                    <span className="text-[11px] text-slate-400">esfuerzo</span>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className={"transition-transform duration-200 mt-1 " + (isOpen ? "rotate-180" : "")}><path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ borderTop: "1.5px solid #dde3eb" }}>
                  {(prog.why_matters || prog.reasons.length > 0) && (
                    <div className="px-7 md:px-10 py-6 bg-[#f7f9fb]">
                      <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-[family-name:var(--font-space-mono)]">Por qué este programa</div>
                      {prog.why_matters && <p className="text-[16px] md:text-[18px] text-slate-700 leading-relaxed mb-3">{prog.why_matters}</p>}
                      {prog.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prog.reasons.map((r, ri) => <span key={ri} className="text-[13px] px-3 py-1 rounded-full bg-white text-slate-600 font-[family-name:var(--font-space-mono)]" style={{ border: "1px solid #dde3eb" }}>{r}</span>)}
                        </div>
                      )}
                    </div>
                  )}

                  {MONTH_ORDER.filter(k => (prog.actions[k]?.length || 0) > 0).map(mk => {
                    const actions = prog.actions[mk]
                    const mHrs = actions.reduce((s, a) => s + a.hours, 0)
                    const done = actions.filter(a => a.status === "completed").length

                    return (
                      <div key={mk}>
                        <div className="px-7 md:px-10 py-4 flex items-center justify-between" style={{ borderTop: "1.5px solid #eef2f6", backgroundColor: "#fafbfc" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-bold uppercase tracking-widest font-[family-name:var(--font-space-mono)]" style={{ color: B }}>{MONTH_LABELS[mk]}</span>
                            <span className="text-[13px] text-slate-400 font-[family-name:var(--font-space-mono)]">
                              {actions.length} acción{actions.length !== 1 ? "es" : ""}{done > 0 && ` · ${done} hecha${done !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                          <span className="text-[14px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)]">{mHrs}h</span>
                        </div>

                        <div>{actions.map(a => {
                          const isDone = a.status === "completed"
                          const bandInfo = a.band ? BAND_LABELS[a.band] : null
                          const isStructured = structuredActions?.has(a.code) || false
                          const isFormOpen = openFormAction === a.code

                          return (
                            <div key={a.id}>
                              <div
                                className={"flex items-start gap-4 px-6 md:px-9 py-5 md:py-6 cursor-pointer transition-colors "
                                  + (isFormOpen ? "bg-blue-50/60" : isDone ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/50")}
                                style={{ borderBottom: isFormOpen ? "none" : "1px solid #eef2f6" }}
                                onClick={() => onActionClick(a)}
                              >
                                {/* Icon */}
                                {isStructured ? (
                                  <div className="w-6 h-6 rounded-md mt-1 flex-shrink-0 flex items-center justify-center"
                                    style={{ border: `2px solid ${isDone ? "#10b981" : B}`, backgroundColor: isDone ? "#10b981" : isFormOpen ? B : "white" }}>
                                    {isDone ? (
                                      <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    ) : (
                                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="2" rx="1" fill={isFormOpen ? "white" : B} /><rect x="2" y="7" width="8" height="2" rx="1" fill={isFormOpen ? "white" : B} /><rect x="2" y="11" width="10" height="2" rx="1" fill={isFormOpen ? "white" : B} /></svg>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-md mt-1 flex-shrink-0 flex items-center justify-center"
                                    style={{ border: `2px solid ${isDone ? B : "#cbd5e1"}`, backgroundColor: isDone ? B : "white" }}>
                                    {isDone && <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={"text-[17px] md:text-[19px] leading-relaxed font-semibold " + (isDone ? "text-slate-400 line-through" : "text-slate-800")}>{a.name}</span>
                                    {isStructured && !isDone && (
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full font-[family-name:var(--font-space-mono)]" style={{ backgroundColor: B + "12", color: B }}>FORMULARIO</span>
                                    )}
                                  </div>
                                  {!isDone && !isFormOpen && a.description && <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-1.5">{a.description}</p>}
                                  {!isDone && !isFormOpen && a.dod && <p className="text-[14px] text-slate-400 mt-2 leading-relaxed"><span className="font-semibold text-slate-500">Hecho cuando:</span> {a.dod}</p>}
                                  {!isDone && !isFormOpen && a.deliverable && <p className="text-[13px] text-slate-400 mt-1.5 font-[family-name:var(--font-space-mono)]">Entregable: {a.deliverable}</p>}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                  {bandInfo && <span className="text-[12px] font-bold px-2 py-0.5 rounded font-[family-name:var(--font-space-mono)]" style={{ backgroundColor: bandInfo.color + "15", color: bandInfo.color }}>{bandInfo.label}</span>}
                                  <span className="text-[14px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)] whitespace-nowrap">{a.hours}h</span>
                                  {isStructured && <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={"transition-transform duration-200 " + (isFormOpen ? "rotate-180" : "")}><path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                              </div>

                              {/* Form panel */}
                              {isFormOpen && supabase && assessmentId && (
                                <div style={{ borderBottom: "1px solid #eef2f6" }}>
                                  <ActionFormPanel supabase={supabase} assessmentId={assessmentId} actionCode={a.code} demoToken={demoToken || null} onSaved={() => onFormSaved(a.code)} onClose={onFormClose} />
                                </div>
                              )}
                            </div>
                          )
                        })}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}