"use client"
import { useState, useMemo, useCallback } from "react"

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
}

const B = "#1a90ff"

const MONTH_LABELS: Record<string, string> = {
  "30d": "Mes 1",
  "60d": "Mes 2",
  "90d": "Mes 3",
  backlog: "Después",
}

const MONTH_ORDER = ["30d", "60d", "90d", "backlog"] as const

const DIM_LABELS: Record<string, string> = {
  EST: "Estrategia",
  OPE: "Operaciones",
  PER: "Personas",
  DAT: "Datos",
  TEC: "Tecnología",
  GOB: "Gobierno",
  strategy: "Estrategia",
  operations: "Operaciones",
  culture: "Personas",
  data: "Datos",
  technology: "Tecnología",
  governance: "Gobierno",
  customer: "Cliente",
}

const BAND_LABELS: Record<string, { label: string; color: string }> = {
  XS: { label: "XS", color: "#10b981" },
  S:  { label: "S",  color: "#10b981" },
  M:  { label: "M",  color: "#f59e0b" },
  "M+": { label: "M+", color: "#f59e0b" },
  L:  { label: "L",  color: "#ef4444" },
  R:  { label: "R",  color: "#8b5cf6" },
  C:  { label: "C",  color: "#8b5cf6" },
  P:  { label: "P",  color: "#6366f1" },
}

// ── Helpers ──

const totalActions = (p: RoadmapProgram) =>
  MONTH_ORDER.reduce((s, k) => s + (p.actions[k]?.length || 0), 0)

const totalHours = (p: RoadmapProgram) =>
  MONTH_ORDER.reduce((s, k) => s + (p.actions[k] || []).reduce((h, a) => h + a.hours, 0), 0)

function cleanName(name: string): string {
  return name.replace(/^\d+\.\s*/, "")
}

// ── Component ──

export default function GapplyRoadmap({
  programs,
  capacity,
  d5,
  capacityExceeded = false,
  capacityExcessHours,
  starterActionsForced = 0,
  onStatusChange,
  loading = false,
}: GapplyRoadmapProps) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})

  const programsWithOverrides = useMemo(() => {
    if (Object.keys(statusOverrides).length === 0) return programs
    return programs.map((p) => ({
      ...p,
      actions: Object.fromEntries(
        Object.entries(p.actions).map(([ph, acts]) => [
          ph,
          acts.map((a) => ({ ...a, status: statusOverrides[a.id] || a.status })),
        ])
      ) as RoadmapProgram["actions"],
    }))
  }, [programs, statusOverrides])

  const handleStatusToggle = useCallback(
    (id: string, newStatus: "pending" | "completed") => {
      setStatusOverrides((prev) => ({ ...prev, [id]: newStatus }))
      onStatusChange?.(id, newStatus)
    },
    [onStatusChange]
  )

  const corePrograms = useMemo(
    () => programsWithOverrides.filter(p => p.code?.includes("CORE")),
    [programsWithOverrides]
  )
  const ringPrograms = useMemo(
    () => programsWithOverrides.filter(p => p.code?.includes("RING")),
    [programsWithOverrides]
  )

  const allPrograms = programsWithOverrides
  const totalProgramCount = allPrograms.length
  const totalActionCount = allPrograms.reduce((s, p) => s + totalActions(p), 0)
  const totalHourCount = allPrograms.reduce((s, p) => s + totalHours(p), 0)

  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-8 mb-4 opacity-60 animate-pulse" style={{ border: "1.5px solid #dde3eb" }}>
            <div className="h-6 bg-slate-200 rounded-lg w-3/5 mb-4" />
            <div className="h-5 bg-slate-100 rounded-lg w-2/5" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* ─── Strategic header ─── */}
      <div className="rounded-2xl p-7 md:p-10 mb-10" style={{ backgroundColor: "#f7f9fb", border: "1.5px solid #dde3eb" }}>
        <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-[family-name:var(--font-space-mono)]">
          Tu hoja de ruta priorizada
        </div>
        <p className="text-[20px] md:text-[24px] font-extrabold text-slate-900 leading-snug tracking-tight mb-3">
          Estas son las áreas que hoy más frenan el crecimiento de tu empresa.
        </p>
        <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed">
          Estos <strong>{totalProgramCount} programas</strong> están ordenados por impacto estructural.
          Cada uno agrupa acciones concretas distribuidas en 3 meses.
          Empieza por el <strong>#1</strong> y avanza en orden.
        </p>
      </div>

      {/* ─── Summary stats ─── */}
      <div className="bg-white rounded-2xl mb-10 flex" style={{ border: "1.5px solid #dde3eb" }}>
        {[
          { value: totalProgramCount, label: "Programas", sublabel: `${corePrograms.length} base + ${ringPrograms.length} expansión` },
          { value: totalActionCount, label: "Acciones", sublabel: "distribuidas en 3 meses" },
          { value: totalHourCount + "h", label: "Esfuerzo estimado", sublabel: "horas de trabajo totales" },
        ].map((stat, i) => (
          <div key={i} className="flex-1 text-center py-8 md:py-10" style={{ borderRight: i < 2 ? "1.5px solid #dde3eb" : "none" }}>
            <div className="text-[32px] md:text-[40px] font-extrabold leading-none" style={{ color: B }}>{stat.value}</div>
            <div className="text-[16px] md:text-[18px] text-slate-800 mt-2 font-semibold">{stat.label}</div>
            <div className="text-[14px] text-slate-400 mt-0.5">{stat.sublabel}</div>
          </div>
        ))}
      </div>

      {/* ─── Recommendation ─── */}
      <div className="rounded-2xl px-7 md:px-10 py-6 mb-10 flex items-start gap-4" style={{ backgroundColor: "#e8f4ff", border: `1.5px solid ${B}30` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: B }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div>
          <p className="text-[16px] md:text-[18px] font-semibold text-slate-900">
            Empieza por los 3 primeros programas.
          </p>
          <p className="text-[15px] md:text-[16px] text-slate-600 mt-1 leading-relaxed">
            Son los que mayor impacto tienen en tu empresa según el diagnóstico.
            Cuando avances en ellos, continúa con los siguientes.
          </p>
        </div>
      </div>

      {/* ─── BASE section ─── */}
      <ProgramSection
        title="Programas base"
        subtitle="La base estructural. Resuelven los problemas que más limitan tu empresa hoy."
        badge="BASE"
        badgeStyle="primary"
        programs={corePrograms}
        openProgramId={openProgramId}
        onToggleOpen={setOpenProgramId}
        onStatusToggle={handleStatusToggle}
        rankOffset={0}
      />

      {/* ─── EXPANSIÓN section ─── */}
      {ringPrograms.length > 0 && (
        <ProgramSection
          title="Programas de expansión"
          subtitle="Amplían tu capacidad digital cuando la base esté cubierta."
          badge="EXPANSIÓN"
          badgeStyle="secondary"
          programs={ringPrograms}
          openProgramId={openProgramId}
          onToggleOpen={setOpenProgramId}
          onStatusToggle={handleStatusToggle}
          rankOffset={corePrograms.length}
        />
      )}

      {/* ─── Legend ─── */}
      <div className="mt-10 rounded-2xl p-7 md:p-10" style={{ backgroundColor: "#f7f9fb", border: "1.5px solid #dde3eb" }}>
        <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-5 font-[family-name:var(--font-space-mono)]">
          Cómo funciona
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full font-[family-name:var(--font-space-mono)]" style={{ backgroundColor: "#e8f4ff", color: B }}>BASE</span>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">
              Programas que atacan tus debilidades estructurales. Son los que más impacto tienen. Empieza por aquí.
            </p>
          </div>
          <div>
            <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-[family-name:var(--font-space-mono)]">EXPANSIÓN</span>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">
              Programas que amplían tu capacidad digital. Complementan a los base cuando la estructura esté sólida.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: B }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[15px] md:text-[16px] font-semibold text-slate-700">Marcar como hecho</span>
            </div>
            <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-2">
              Haz clic en cada acción para registrar tu progreso durante la sesión.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Program Section
// ══════════════════════════════════════════════════════════

function ProgramSection({
  title,
  subtitle,
  badge,
  badgeStyle,
  programs,
  openProgramId,
  onToggleOpen,
  onStatusToggle,
  rankOffset,
}: {
  title: string
  subtitle: string
  badge: string
  badgeStyle: "primary" | "secondary"
  programs: RoadmapProgram[]
  openProgramId: string | null
  onToggleOpen: (id: string | null) => void
  onStatusToggle: (id: string, s: "pending" | "completed") => void
  rankOffset: number
}) {
  const isPrimary = badgeStyle === "primary"

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-2">
        <span
          className="text-[13px] font-bold px-3 py-1 rounded-full font-[family-name:var(--font-space-mono)]"
          style={isPrimary
            ? { backgroundColor: "#e8f4ff", color: B }
            : { backgroundColor: "#f1f5f9", color: "#64748b" }
          }
        >
          {badge}
        </span>
        <h2 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <p className="text-[16px] md:text-[18px] text-slate-500 mb-8 leading-relaxed">{subtitle}</p>

      <div className="flex flex-col gap-5">
        {programs.map((prog, i) => {
          const rank = rankOffset + i + 1
          const hrs = totalHours(prog)
          const acts = totalActions(prog)
          const isOpen = openProgramId === prog.id
          const dimLabel = DIM_LABELS[prog.dimension] || prog.dimension
          const name = cleanName(prog.name)
          const isTop3 = rank <= 3

          return (
            <div
              key={prog.id}
              className={"bg-white rounded-2xl overflow-hidden transition-all " + (isOpen ? "shadow-md" : "hover:shadow-sm")}
              style={{
                border: isOpen ? `2px solid ${B}` : isTop3 ? `1.5px solid ${B}50` : "1.5px solid #dde3eb",
              }}
            >
              {/* ─── Header ─── */}
              <div
                onClick={() => onToggleOpen(isOpen ? null : prog.id)}
                className="px-7 md:px-10 py-7 md:py-8 cursor-pointer"
                style={isTop3 && !isOpen ? { backgroundColor: "#fafcff" } : {}}
              >
                <div className="flex items-start gap-5 md:gap-6">
                  {/* Priority block */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-[20px] font-extrabold"
                      style={isTop3
                        ? { backgroundColor: B, color: "white" }
                        : isPrimary
                        ? { backgroundColor: "#e8f4ff", color: B, border: `2px solid ${B}` }
                        : { backgroundColor: "#f7f9fb", color: "#94a3b8", border: "1.5px solid #dde3eb" }
                      }
                    >
                      {rank}
                    </div>
                    {isTop3 && (
                      <span className="text-[10px] font-bold mt-1.5 uppercase tracking-wider font-[family-name:var(--font-space-mono)]"
                        style={{ color: B }}
                      >
                        PRIORIDAD
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug mb-1">
                      {name}
                    </h3>

                    {prog.dolor_ceo && (
                      <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed mb-2">{prog.dolor_ceo}</p>
                    )}

                    {rank === 1 && (
                      <p className="text-[12px] font-bold uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]"
                        style={{ color: B }}
                      >
                        Mayor impacto detectado en tu diagnóstico
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-slate-400">{dimLabel}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[14px] text-slate-400 font-[family-name:var(--font-space-mono)]">
                        {acts} acciones en 3 meses
                      </span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-1">
                    <span className="text-[16px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)]">{hrs}h</span>
                    <span className="text-[11px] text-slate-400">esfuerzo</span>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none"
                      className={"transition-transform duration-200 mt-1 " + (isOpen ? "rotate-180" : "")}
                    >
                      <path d="M4 6L8 10L12 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* ─── Expanded ─── */}
              {isOpen && (
                <div style={{ borderTop: "1.5px solid #dde3eb" }}>
                  {(prog.why_matters || prog.reasons.length > 0) && (
                    <div className="px-7 md:px-10 py-6 bg-[#f7f9fb]">
                      <div className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 font-[family-name:var(--font-space-mono)]">
                        Por qué este programa
                      </div>
                      {prog.why_matters && (
                        <p className="text-[16px] md:text-[18px] text-slate-700 leading-relaxed mb-3">{prog.why_matters}</p>
                      )}
                      {prog.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prog.reasons.map((r, ri) => (
                            <span key={ri} className="text-[13px] px-3 py-1 rounded-full bg-white text-slate-600 font-[family-name:var(--font-space-mono)]"
                              style={{ border: "1px solid #dde3eb" }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {MONTH_ORDER.filter(k => (prog.actions[k]?.length || 0) > 0).map((monthKey) => {
                    const actions = prog.actions[monthKey]
                    const monthHrs = actions.reduce((s, a) => s + a.hours, 0)
                    const completedCount = actions.filter(a => a.status === "completed").length

                    return (
                      <div key={monthKey}>
                        <div className="px-7 md:px-10 py-4 flex items-center justify-between" style={{ borderTop: "1.5px solid #eef2f6", backgroundColor: "#fafbfc" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-bold uppercase tracking-widest font-[family-name:var(--font-space-mono)]"
                              style={{ color: B }}
                            >
                              {MONTH_LABELS[monthKey]}
                            </span>
                            <span className="text-[13px] text-slate-400 font-[family-name:var(--font-space-mono)]">
                              {actions.length} acción{actions.length !== 1 ? "es" : ""}
                              {completedCount > 0 && ` · ${completedCount} hecha${completedCount !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                          <span className="text-[14px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)]">{monthHrs}h</span>
                        </div>

                        <div>
                          {actions.map((a) => {
                            const done = a.status === "completed"
                            const bandInfo = a.band ? BAND_LABELS[a.band] : null

                            return (
                              <div
                                key={a.id}
                                className={"flex items-start gap-4 px-6 md:px-9 py-5 md:py-6 cursor-pointer transition-colors " + (done ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/50")}
                                style={{ borderBottom: "1px solid #eef2f6" }}
                                onClick={() => onStatusToggle(a.id, done ? "pending" : "completed")}
                              >
                                <div
                                  className="w-6 h-6 rounded-md mt-1 flex-shrink-0 flex items-center justify-center transition-all"
                                  style={{ border: `2px solid ${done ? B : "#cbd5e1"}`, backgroundColor: done ? B : "white" }}
                                >
                                  {done && (
                                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <span className={"text-[17px] md:text-[19px] leading-relaxed font-semibold " + (done ? "text-slate-400 line-through" : "text-slate-800")}>
                                    {a.name}
                                  </span>
                                  {!done && a.description && (
                                    <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed mt-1.5">{a.description}</p>
                                  )}
                                  {!done && a.dod && (
                                    <p className="text-[14px] text-slate-400 mt-2 leading-relaxed">
                                      <span className="font-semibold text-slate-500">Hecho cuando:</span> {a.dod}
                                    </p>
                                  )}
                                  {!done && a.deliverable && (
                                    <p className="text-[13px] text-slate-400 mt-1.5 font-[family-name:var(--font-space-mono)]">
                                      Entregable: {a.deliverable}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                  {bandInfo && (
                                    <span className="text-[12px] font-bold px-2 py-0.5 rounded font-[family-name:var(--font-space-mono)]"
                                      style={{ backgroundColor: bandInfo.color + "15", color: bandInfo.color }}
                                    >
                                      {bandInfo.label}
                                    </span>
                                  )}
                                  <span className="text-[14px] font-bold text-slate-400 font-[family-name:var(--font-space-mono)] whitespace-nowrap">
                                    {a.hours}h
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
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