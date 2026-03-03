"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import GapplyRoadmap from "./GapplyRoadmap"
import { fetchRoadmapWithSummary, updateActionStatus, RoadmapData } from "@/lib/dts/roadmap-data"

export default function RoadmapSection({ assessmentId }: { assessmentId: string }) {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ), [])
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // V2.2 uses catalog-direct (no initiatives table), so status tracking
  // is in-memory only for now. V1 persists to dts_v2_initiatives.
  const isV22 = data?.summary?.version === 'v2.2'

  const handleStatusChange = useCallback(
    async (id: string, s: "pending" | "completed") => {
      if (isV22) {
        // V2.2: update in-memory only (no initiatives table)
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
        // V1: persist to initiatives table
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
    />
  )
}