"use client"
import { useState, useRef, useMemo, useCallback } from "react"
import ActionFormPanel from "@/components/dts/ActionFormPanel"

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
  que_hacer: string | null
  como_hacerlo: string | null
  para_que_sirve: string | null
  entregable_concreto: string | null
  ejemplo: string | null
}

interface RoadmapProgram {
  id: string
  code: string
  name: string
  dimension: string
  tier: number | string
  dolor_ceo: string | null
  why_matters: string | null
  expected_outcome: string | null
  ejemplos: any | null
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
  assessmentId: string
  programs: RoadmapProgram[]
  capacity: { "30d": CapacityPhase; "60d": CapacityPhase; "90d": CapacityPhase }
  d5: D5Dimension[]
  capacityExceeded?: boolean
  capacityExcessHours?: CapacityExcess
  starterActionsForced?: number
}

const B = "#1a90ff"
const MONTH_LABELS: Record<string, string> = { "30d": "Mes 1", "60d": "Mes 2", "90d": "Mes 3", backlog: "Después" }
const MONTH_ORDER = ["30d", "60d", "90d", "backlog"] as const

const DIM_LABELS: Record<string, string> = {
  EST: "Estrategia", OPE: "Operaciones", PER: "Personas", DAT: "Datos",
  TEC: "Tecnología", GOB: "Gobierno", strategy: "Estrategia", operations: "Operaciones",
  culture: "Personas", data: "Datos", technology: "Tecnología", governance: "Gobierno", customer: "Cliente",
}

const totalHours = (p: RoadmapProgram) => MONTH_ORDER.reduce((s, k) => s + (p.actions[k] || []).reduce((h, a) => h + a.hours, 0), 0)
const totalActions = (p: RoadmapProgram) => MONTH_ORDER.reduce((s, k) => s + (p.actions[k]?.length || 0), 0)
const cleanName = (n: string) => { const raw = n.replace(/^\d+\.\s*/, "").toLowerCase(); return raw.charAt(0).toUpperCase() + raw.slice(1) }

// ── Main ──

export default function GapplyRoadmap({
  assessmentId, programs, capacity, d5,
  capacityExceeded = false, capacityExcessHours, starterActionsForced = 0,
}: GapplyRoadmapProps) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [openEjemplo, setOpenEjemplo] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [openProgInfo, setOpenProgInfo] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  const programsWithOverrides = useMemo(() => {
    if (!Object.keys(statusOverrides).length) return programs
    return programs.map(p => ({
      ...p,
      actions: Object.fromEntries(
        Object.entries(p.actions).map(([ph, acts]) => [ph, acts.map(a => ({ ...a, status: statusOverrides[a.id] || a.status }))])
      ) as RoadmapProgram["actions"],
    }))
  }, [programs, statusOverrides])

  const handleActionClick = useCallback((a: RoadmapAction) => {
    const next = a.status === "completed" ? "pending" : "completed"
    setStatusOverrides(prev => ({ ...prev, [a.id]: next }))
    if (next === "completed") {
      setJustCompleted(a.id)
      setTimeout(() => setJustCompleted(null), 1500)
    }
    fetch("/api/dts/roadmap/action-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, actionId: a.id, status: next }),
    }).then(r => r.json()).then(res => {
      if (!res.ok) console.error("[GapplyRoadmap] Error persistiendo:", res.error)
    })
  }, [assessmentId])

  const allActions = useMemo(() =>
    programs.flatMap(p => MONTH_ORDER.flatMap(k => p.actions[k] || [])),
    [programs]
  )
  const totalCount = allActions.length
  const doneCount = allActions.filter(a => (statusOverrides[a.id] || a.status) === "completed").length
  const globalPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const sectionProps = {
    assessmentId,
    openProgramId, onToggleOpen: setOpenProgramId, onActionClick: handleActionClick,
    openEjemplo, onToggleEjemplo: setOpenEjemplo,
    openActionId, onToggleAction: setOpenActionId,
    openProgInfo, onToggleProgInfo: setOpenProgInfo,
    justCompleted, statusOverrides,
  }

  return (
    <div>
      {/* Barra progreso global */}
      <div className="mb-5 bg-white rounded-2xl px-7 py-5" style={{ border: "1.5px solid #dde3eb" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-bold text-slate-800">Progreso total</span>
          <div className="text-right">
            <span className="text-[22px] font-extrabold font-[family-name:var(--font-space-mono)]"
              style={{ color: globalPct === 100 ? "#10b981" : B }}>{globalPct}%</span>
            <span className="text-[13px] text-slate-400 ml-2">{doneCount} de {totalCount} acciones</span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100">
          <div className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${globalPct}%`, backgroundColor: globalPct === 100 ? "#10b981" : B }} />
        </div>
      </div>

      <ProgramSection
        title="" subtitle=""
        programs={programsWithOverrides}
        rankOffset={0}
        {...sectionProps}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MonthRows
// ══════════════════════════════════════════════════════════

function MonthRows({ prog, assessmentId, openActionId, openEjemplo, onToggleAction, onToggleEjemplo, onActionClick, justCompleted, statusOverrides }: {
  prog: RoadmapProgram
  assessmentId: string
  openActionId: string | null; onToggleAction: (id: string | null) => void
  openEjemplo: string | null; onToggleEjemplo: (id: string | null) => void
  onActionClick: (a: RoadmapAction) => void
  justCompleted: string | null
  statusOverrides: Record<string, string>
}) {
  let globalNum = 0
  const visibleMonths = MONTH_ORDER.filter(k => (prog.actions[k]?.length || 0) > 0)

  return (
    <div className="px-5 pb-6 pt-2" style={{ backgroundColor: "#f0f4f9" }}>
      {visibleMonths.map((mk) => {
        const actions = prog.actions[mk]
        const mHrs = actions.reduce((s, a) => s + a.hours, 0)
        const done = actions.filter(a => (statusOverrides[a.id] || a.status) === "completed").length
        const monthDone = done === actions.length

        return (
          <div key={mk} className="mb-5">

            {/* Etiqueta del mes */}
            <div className="flex items-center justify-between px-1 pb-3 pt-4">
              <div className="flex items-center gap-2">
                {monthDone && (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "#10b981" }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
                <span className="text-[13px] font-extrabold uppercase tracking-widest font-[family-name:var(--font-space-mono)]"
                  style={{ color: monthDone ? "#10b981" : "#475569" }}>
                  {MONTH_LABELS[mk]}
                </span>
                <span className="text-[12px] font-medium font-[family-name:var(--font-space-mono)]"
                  style={{ color: monthDone ? "#10b981" : "#94a3b8" }}>
                  {monthDone
                    ? "· completado"
                    : `· ${actions.length} acción${actions.length !== 1 ? "es" : ""}${done > 0 ? `, ${done} hecha${done !== 1 ? "s" : ""}` : ""}`}
                </span>
              </div>
              <span className="text-[12px] font-bold font-[family-name:var(--font-space-mono)]"
                style={{ color: monthDone ? "#10b981" : "#94a3b8" }}>{mHrs}h</span>
            </div>

            {/* Tarjetas de acciones — generosas, estilo Gapply */}
            <div className="flex flex-col gap-3">
              {actions.map((a) => {
                globalNum++
                const actionNum = globalNum
                const isDone = (statusOverrides[a.id] || a.status) === "completed"
                const isJustDone = justCompleted === a.id
                const isOpen = openActionId === a.id
                const isEjemploOpen = openEjemplo === a.id
                const hasNewFields = !!a.que_hacer

                return (
                  <div key={a.id}
                    className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      border: isOpen
                        ? `2px solid ${B}`
                        : isDone
                        ? "1.5px solid #a7f3d0"
                        : "1.5px solid #dde3eb",
                      backgroundColor: "white",
                      boxShadow: isOpen ? `0 4px 20px ${B}18` : isDone ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Cabecera de la acción — grande y respira */}
                    <div
                      className="flex items-center gap-4 px-6 py-6 cursor-pointer"
                      style={{
                        backgroundColor: isJustDone ? "#f0fdf4" : isDone ? "#f0fdf4" : isOpen ? `${B}06` : "white",
                        transition: "background-color 0.2s",
                      }}
                      onClick={() => onToggleAction(isOpen ? null : a.id)}
                    >
                      {/* Checkbox grande */}
                      <div className="flex-shrink-0" onClick={e => { e.stopPropagation(); onActionClick(a) }}>
                        <div
                          className={"w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 " + (isJustDone ? "scale-125" : "")}
                          style={{
                            border: `2px solid ${isDone ? "#10b981" : "#cbd5e1"}`,
                            backgroundColor: isDone ? "#10b981" : "white",
                          }}
                        >
                          {isDone && <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                      </div>

                      {/* Texto — tamaño Gapply */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold leading-tight"
                          style={{ fontSize: 28, color: isDone ? "#a7f3d0" : B }}>
                          Acción {actionNum}
                        </p>
                        <p className={"font-extrabold leading-snug mt-1 "
                          + (isDone ? "text-slate-400 line-through" : "text-slate-900")}
                          style={{ fontSize: 22 }}>
                          {a.name}
                        </p>
                      </div>

                      {/* Horas + chevron */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[15px] font-bold font-[family-name:var(--font-space-mono)]"
                          style={{ color: isDone ? "#86efac" : "#64748b" }}>{a.hours}h</span>
                        {!isDone && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                            className={"transition-transform duration-200 " + (isOpen ? "rotate-180" : "")}>
                            <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Detalle de la acción — dentro de la misma tarjeta */}
                    {isOpen && (
                      <div style={{ borderTop: `1.5px solid ${B}20`, backgroundColor: "#f6f9ff" }}>

                        {/* Contenido enriquecido */}
                        {hasNewFields && (
                          <div className="px-5 py-4 flex flex-col gap-4">
                            {a.que_hacer && (
                              <div>
                                <p className="text-[14px] font-bold text-slate-500 mb-2">Qué hacer</p>
                                <p className="text-[15px] md:text-[16px] text-slate-900 leading-relaxed font-semibold">{a.que_hacer}</p>
                              </div>
                            )}
                            {a.como_hacerlo && (
                              <div>
                                <p className="text-[14px] font-bold text-slate-500 mb-2">Cómo hacerlo</p>
                                <p className="text-[15px] md:text-[16px] text-slate-700 leading-relaxed">{a.como_hacerlo}</p>
                              </div>
                            )}
                            {a.para_que_sirve && (
                              <div>
                                <p className="text-[14px] font-bold text-slate-500 mb-2">Para qué sirve</p>
                                <p className="text-[15px] md:text-[16px] text-slate-700 leading-relaxed">{a.para_que_sirve}</p>
                              </div>
                            )}
                            {a.entregable_concreto && (
                              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "#f0fdf4", border: "1px solid #d1fae5" }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                                <div>
                                  <p className="text-[14px] font-bold text-emerald-600 mb-2">Terminado cuando</p>
                                  <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{a.entregable_concreto}</p>
                                </div>
                              </div>
                            )}
                            {a.ejemplo && (
                              <div>
                                <button
                                  onClick={e => { e.stopPropagation(); onToggleEjemplo(isEjemploOpen ? null : a.id) }}
                                  className="flex items-center gap-2 text-[12px] font-semibold transition-opacity hover:opacity-70"
                                  style={{ color: B }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                  </svg>
                                  {isEjemploOpen ? "Ocultar ejemplo" : "Ver ejemplo real"}
                                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className={"transition-transform " + (isEjemploOpen ? "rotate-180" : "")}>
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                                {isEjemploOpen && (
                                  <div className="mt-2 px-4 py-3 rounded-xl text-[13px] text-slate-700 leading-relaxed"
                                    style={{ backgroundColor: "#fef9c3", border: "1px solid #fde68a" }}>
                                    {a.ejemplo}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contenido legacy */}
                        {!hasNewFields && (a.description || a.dod) && (
                          <div className="px-5 py-4">
                            {a.description && <p className="text-[15px] text-slate-700 leading-relaxed">{a.description}</p>}
                            {a.dod && <p className="text-[13px] text-slate-500 mt-2"><span className="font-semibold">Hecho cuando:</span> {a.dod}</p>}
                          </div>
                        )}

                        {/* Formulario dentro de la tarjeta */}
                        <div style={{ borderTop: `1px solid ${B}15` }}>
                          <ActionFormPanel
                            assessmentId={assessmentId}
                            actionCode={a.code}
                            demoToken={null}
                            hoursTypical={a.hours_typical}
                            onSaved={() => onActionClick(a)}
                            onClose={() => onToggleAction(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// ProgramSection
// ══════════════════════════════════════════════════════════

function ProgramSection({ title, subtitle, programs, assessmentId, openProgramId, onToggleOpen, onActionClick, rankOffset, openEjemplo, onToggleEjemplo, openActionId, onToggleAction, openProgInfo, onToggleProgInfo, justCompleted, statusOverrides }: {
  title: string; subtitle: string
  programs: RoadmapProgram[]
  assessmentId: string
  openProgramId: string | null; onToggleOpen: (id: string | null) => void
  onActionClick: (a: RoadmapAction) => void; rankOffset: number
  openEjemplo: string | null; onToggleEjemplo: (id: string | null) => void
  openActionId: string | null; onToggleAction: (id: string | null) => void
  openProgInfo: string | null; onToggleProgInfo: (id: string | null) => void
  justCompleted: string | null
  statusOverrides: Record<string, string>
}) {
  const programRefs = useRef<Record<string, HTMLDivElement>>({})

  return (
    <div className="mb-10">
      <div className="flex flex-col gap-3">
        {programs.map((prog, i) => {
          const rank = rankOffset + i + 1, hrs = totalHours(prog), acts = totalActions(prog)
          const isOpen = openProgramId === prog.id, isTop3 = rank <= 3
          const dimLabel = DIM_LABELS[prog.dimension] || prog.dimension, name = cleanName(prog.name)
          const allActs = MONTH_ORDER.flatMap(k => prog.actions[k] || [])
          const progDone = allActs.length > 0 && allActs.every(a => (statusOverrides[a.id] || a.status) === "completed")

          return (
            <div key={prog.id}
              ref={(el) => { if (el) programRefs.current[prog.id] = el }}
              className={"bg-white rounded-2xl overflow-hidden transition-all " + (isOpen ? "shadow-md" : "hover:shadow-sm")}
              style={{
                border: progDone ? "2px solid #10b981"
                  : isOpen ? `2px solid ${B}`
                  : rank === 1 ? `2px solid ${B}`
                  : rank <= 3 ? `1.5px solid ${B}80`
                  : rank <= 6 ? "1.5px solid #e2e8f0"
                  : "1.5px solid #eef2f6"
              }}>

              {rank === 1 && (
                <div className="px-6 md:px-8 py-3 flex items-center gap-2" style={{ backgroundColor: B }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  <span className="text-[13px] font-bold text-white uppercase tracking-widest font-[family-name:var(--font-space-mono)]">Empieza por aquí</span>
                </div>
              )}

              {/* Cabecera programa */}
              <div onClick={() => {
                const opening = !isOpen
                onToggleOpen(isOpen ? null : prog.id)
                if (opening) {
                  setTimeout(() => {
                    programRefs.current[prog.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 50)
                }
              }}
                className="px-6 md:px-8 py-7 md:py-9 cursor-pointer"
                style={isTop3 && !isOpen ? { backgroundColor: "#fafcff" } : {}}>
                <div className="flex items-start gap-5 md:gap-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px] font-extrabold flex-shrink-0 mt-0.5"
                    style={isTop3 ? { backgroundColor: B, color: "white" } : { backgroundColor: "#eef2f6", color: "#64748b", border: "1.5px solid #dde3eb" }}>
                    {rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    {prog.dolor_ceo && (
                      <p className="text-slate-900 leading-snug font-extrabold mb-1.5" style={{ fontSize: 36 }}>{prog.dolor_ceo}</p>
                    )}
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[16px] font-semibold text-slate-400">{acts} acciones</span>
                      {!isTop3 && rank <= 6 && <span className="text-[13px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-[family-name:var(--font-space-mono)]">SIGUIENTE</span>}
                      {rank > 6 && <span className="text-[13px] font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-400 font-[family-name:var(--font-space-mono)]">OPCIONAL</span>}
                      {(() => {
                        const done = allActs.filter(a => (statusOverrides[a.id] || a.status) === 'completed').length
                        if (done === 0) return null
                        const pct = Math.round((done / allActs.length) * 100)
                        const color = pct === 100 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#1a90ff'
                        const emoji = pct === 100 ? '✓' : null
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-[14px] font-bold font-[family-name:var(--font-space-mono)]" style={{ color }}>
                              {emoji || `${done}/${allActs.length}`}
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-1">
                    <span className="text-[15px] font-bold text-slate-500 font-[family-name:var(--font-space-mono)]">{hrs}h</span>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className={"transition-transform duration-200 mt-1 " + (isOpen ? "rotate-180" : "")}>
                      <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Interior expandido */}
              {isOpen && (() => {
                const allActs = MONTH_ORDER.flatMap(k => prog.actions[k] || [])
                const total = allActs.length
                const done = allActs.filter(a => (statusOverrides[a.id] || a.status) === "completed").length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                const infoOpen = openProgInfo === prog.id

                return (
                  <div style={{ borderTop: "1.5px solid #dde3eb" }}>

                    {/* Progreso */}
                    <div className="px-6 md:px-8 py-4 flex items-center gap-5"
                      style={{ borderBottom: "1px solid #eef2f6", backgroundColor: "#fafcff" }}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-bold text-slate-500 font-[family-name:var(--font-space-mono)]">Progreso</span>
                          <span className="text-[16px] font-bold text-slate-700 font-[family-name:var(--font-space-mono)]">{done}/{total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: B }} />
                        </div>
                      </div>
                      <span className="text-[20px] font-extrabold flex-shrink-0" style={{ color: pct > 0 ? B : "#e2e8f0" }}>{pct}%</span>
                    </div>

                    {/* Al terminar + Por qué está en tu plan */}
                    {(prog.expected_outcome || (prog.reasons && prog.reasons.length > 0)) && (
                      <div className="px-6 md:px-8 py-5 flex flex-col gap-4" style={{ borderBottom: "1px solid #eef2f6", backgroundColor: "#f7f9fb" }}>
                        {prog.expected_outcome && (
                          <div>
                            <p className="text-[13px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-[family-name:var(--font-space-mono)]">Al terminar</p>
                            <p className="text-[17px] text-slate-800 leading-relaxed font-medium">{prog.expected_outcome}</p>
                          </div>
                        )}
                        {prog.reasons && prog.reasons.length > 0 && (
                          <div>
                            <p className="text-[13px] font-bold uppercase tracking-widest text-slate-400 mb-2 font-[family-name:var(--font-space-mono)]">Por qué está en tu plan</p>
                            <div className="flex flex-col gap-1.5">
                              {prog.reasons.map((r: string, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#1a90ff" }} />
                                  <p className="text-[16px] text-slate-700 leading-snug">{r}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meses y acciones como tarjetas dentro del programa */}
                    {MonthRows({ prog, assessmentId, openActionId, openEjemplo, onToggleAction, onToggleEjemplo, onActionClick, justCompleted, statusOverrides })}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}