"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import GapplyRoadmap from "./GapplyRoadmap"
import { fetchRoadmapWithSummary, updateActionStatus, RoadmapData } from "@/lib/dts/roadmap-data"

// V2.2: action codes that have structured templates (forms instead of checkboxes).
// These match gapply_action_templates with template_type = 'structured'.
const STRUCTURED_ACTION_CODES = new Set([
  "PRG-CORE-01-A01",
  "PRG-CORE-01-A02",
  "PRG-CORE-01-A03",
  "PRG-CORE-02-A01",
  "PRG-CORE-02-A02",
  "PRG-CORE-02-A03",
  "PRG-CORE-03-A01",
  "PRG-CORE-03-A02",
])

export default function RoadmapSection({ assessmentId }: { assessmentId: string }) {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ), [])
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // V2.2: demo token from URL params (e.g. ?demo_token=xxx)
  const demoToken = useMemo(() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    return params.get("demo_token")
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const roadmap = await fetchRoadmapWithSummary(supabase, assessmentId)
      setData(roadmap)
    } catch (err: any) {
      setError(err.message || "Error al cargar el plan de accion")
    } finally {
      setLoading(false)
    }
  }, [assessmentId, supabase])

  useEffect(() => {
    if (!assessmentId) return
    let cancelled = false
    loadData().then(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [assessmentId, loadData])

  const isV22 = data?.summary?.version === 'v2.2'

  const handleStatusChange = useCallback(
    async (id: string, s: "pending" | "completed") => {
      if (isV22) {
        setData(prev => {
          if (!prev) return prev
          const updated = { ...prev, programs: prev.programs.map(p => ({
            ...p,
            actions: Object.fromEntries(
              Object.entries(p.actions).map(([phase, actions]) => [
                phase,
                actions.map(a => a.id === id ? { ...a, status: s } : a)
              ])
            ) as any,
          }))}
          return updated
        })
      } else {
        try { await updateActionStatus(supabase, id, s) } catch {}
      }
    }, [isV22, supabase]
  )

  if (error) return (
    <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1.5px solid #dde3eb" }}>
      <div className="text-[17px] font-bold text-slate-800 mb-2">No hemos podido cargar tu plan de accion</div>
      <div className="text-[15px] text-slate-500 mb-5">{error}</div>
      <button
        onClick={loadData}
        className="px-6 py-2.5 rounded-xl text-[15px] font-semibold text-white"
        style={{ backgroundColor: "#1a90ff" }}
      >
        Reintentar
      </button>
    </div>
  )

  return (
    <GapplyRoadmap
      programs={data?.programs || []}
      capacity={data?.capacity || { "30d": { limit: 40, used: 0 }, "60d": { limit: 80, used: 0 }, "90d": { limit: 120, used: 0 } }}
      d5={data?.d5 || []}
      capacityExceeded={data?.summary?.capacity_exceeded || false}
      capacityExcessHours={data?.summary?.capacity_excess_hours}
      starterActionsForced={data?.summary?.starter_actions_forced || 0}
      onStatusChange={handleStatusChange}
      loading={loading}
      // V2.2: structured templates
      supabase={supabase}
      assessmentId={assessmentId}
      demoToken={demoToken}
      structuredActions={STRUCTURED_ACTION_CODES}
    />
  )
}