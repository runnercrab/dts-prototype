"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import GapplyRoadmap from "./GapplyRoadmap"
import { fetchRoadmapWithSummary, RoadmapData } from "@/lib/dts/roadmap-data"

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

export default function RoadmapSection({
  assessmentId,
  score,
  scoreLabel,
}: {
  assessmentId: string
}) {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ), [])

  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const demoToken = useMemo(() => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("demo_token")
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const roadmap = await fetchRoadmapWithSummary(supabase, assessmentId)
      setData(roadmap)
    } catch (err: any) {
      setError(err.message || "Error al cargar el plan de acción")
    } finally {
      setLoading(false)
    }
  }, [assessmentId, supabase])

  useEffect(() => {
    if (!assessmentId) return
    loadData()
  }, [assessmentId, loadData])

  // Sin bifurcación de packs — mismo handler para todos
  const handleStatusChange = useCallback(
    async (actionId: string, status: "pending" | "completed") => {
      // 1. Pintar inmediatamente (optimistic)
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          programs: prev.programs.map(p => ({
            ...p,
            actions: Object.fromEntries(
              Object.entries(p.actions).map(([phase, actions]) => [
                phase,
                (actions as any[]).map(a => a.id === actionId ? { ...a, status } : a),
              ])
            ) as any,
          })),
        }
      })

      // 2. Persistir en BD (fire and forget)
      fetch("/api/dts/roadmap/action-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, actionId, status }),
      }).then(r => r.json()).then(result => {
        if (!result.ok) console.error("[RoadmapSection] Error persistiendo:", result.error)
      })
    },
    [assessmentId]
  )

  if (error) return (
    <div className="bg-white rounded-2xl p-8 text-center" style={{ border: "1.5px solid #dde3eb" }}>
      <div className="text-[17px] font-bold text-slate-800 mb-2">No hemos podido cargar tu plan de acción</div>
      <div className="text-[15px] text-slate-500 mb-5">{error}</div>
      <button onClick={loadData} className="px-6 py-2.5 rounded-xl text-[15px] font-semibold text-white" style={{ backgroundColor: "#1a90ff" }}>
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
      supabase={supabase}
      assessmentId={assessmentId}
      demoToken={demoToken}
      structuredActions={STRUCTURED_ACTION_CODES}
    />
  )
}