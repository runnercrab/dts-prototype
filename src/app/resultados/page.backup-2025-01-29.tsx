'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import KPICards from '@/components/KPICards'
import RadarChartComponent from '@/components/RadarChartComponent'
import { formatMaturityIndex, getMaturityLabel, maturityIndexToPercentage } from '@/lib/scoring-utils'

type ScoreGetResponse = {
  ok: boolean
  assessmentId?: string
  pack?: string
  score?: {
    overall_index?: number
    dimensions?: Array<{ code: string; name: string; index: number }>
  }
  error?: string
}

type AssessmentGetResponse = {
  ok: boolean
  assessment?: {
    id: string
    pack: string
    status: string
    current_phase?: number
    onboarding_data?: any
  }
  error?: string
}

const STORAGE_KEY = 'dts_assessment_id'

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)
}

export default function ResultadosPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [pack, setPack] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [overallIndex, setOverallIndex] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState<Array<{ name: string; index: number }>>([])
  const [error, setError] = useState<string | null>(null)

  // Resolve assessmentId (query param preferred, fallback to localStorage)
  useEffect(() => {
    const fromQuery = sp.get('assessmentId')
    if (fromQuery && isUuid(fromQuery)) {
      setAssessmentId(fromQuery)
      try {
        localStorage.setItem(STORAGE_KEY, fromQuery)
      } catch {}
      return
    }

    try {
      const fromLs = localStorage.getItem(STORAGE_KEY)
      if (fromLs && isUuid(fromLs)) {
        setAssessmentId(fromLs)
        return
      }
    } catch {}

    setAssessmentId(null)
  }, [sp])

  useEffect(() => {
    async function run() {
      if (!assessmentId) {
        router.push('/diagnostico-full')
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 1) Read assessment metadata
        const aRes = await fetch(`/api/dts/assessment/get?assessmentId=${assessmentId}`, {
          cache: 'no-store',
        })
        const aJson = (await aRes.json()) as AssessmentGetResponse
        if (!aJson.ok || !aJson.assessment) {
          setError(aJson.error || 'No se pudo cargar el assessment')
          setLoading(false)
          return
        }
        setPack(aJson.assessment.pack)
        setStatus(aJson.assessment.status)

        // 2) Read score
        const sRes = await fetch(`/api/dts/score/get?assessmentId=${assessmentId}`, { cache: 'no-store' })
        const sJson = (await sRes.json()) as ScoreGetResponse

        if (!sJson.ok || !sJson.score) {
          // Si aún no hay score calculado (0 respuestas) lo tratamos como estado válido.
          setOverallIndex(null)
          setDimensions([])
          setLoading(false)
          return
        }

        const ov = typeof sJson.score.overall_index === 'number' ? sJson.score.overall_index : null
        setOverallIndex(ov)

        const dims =
          Array.isArray(sJson.score.dimensions) && sJson.score.dimensions.length
            ? sJson.score.dimensions.map(d => ({
                name: d.name,
                index: d.index,
              }))
            : []
        setDimensions(dims)

        setLoading(false)
      } catch (e: any) {
        setError(e?.message || 'Error inesperado')
        setLoading(false)
      }
    }

    run()
  }, [assessmentId, router])

  const overallLabel = useMemo(() => {
    if (overallIndex === null) return 'Sin datos todavía'
    return getMaturityLabel(overallIndex)
  }, [overallIndex])

  const overallPct = useMemo(() => {
    if (overallIndex === null) return 0
    return maturityIndexToPercentage(overallIndex)
  }, [overallIndex])

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#0f172a' }}>
            Resultados
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#64748b' }}>
            Assessment: <span className="font-mono">{assessmentId || '-'}</span> · Pack: <b>{pack || '-'}</b> · Estado:{' '}
            <b>{status || '-'}</b>
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn" onClick={() => router.push(`/diagnostico-full?assessmentId=${assessmentId}`)}>
            Volver al diagnóstico
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-10">
          <div className="card">
            <div className="card-body">
              <p style={{ color: '#475569' }}>Cargando resultados…</p>
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="mt-10">
          <div className="card" style={{ border: '1px solid #fecaca', background: '#fff1f2' }}>
            <div className="card-body">
              <p className="font-semibold" style={{ color: '#991b1b' }}>
                Error
              </p>
              <p style={{ color: '#7f1d1d' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-10 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <div className="card-body">
                <p className="kpi">Score global</p>
                <div className="mt-2 flex items-end gap-3">
                  <div className="text-4xl font-bold" style={{ color: '#0f172a' }}>
                    {overallIndex === null ? '—' : formatMaturityIndex(overallIndex)}
                  </div>
                  <div className="text-sm" style={{ color: '#64748b' }}>
                    {overallLabel} · {overallPct}%
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="kpi">Radar (6 dimensiones)</p>
                <div className="mt-4">
                  <RadarChartComponent data={dimensions} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <p className="kpi">KPIs</p>
              <div className="mt-4">
                <KPICards assessmentId={assessmentId!} />
              </div>
            </div>
          </div>

          {overallIndex === null && (
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="card-body">
                <p style={{ color: '#1e40af' }}>
                  Aún no hay respuestas guardadas. Completa el diagnóstico para calcular el score.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
