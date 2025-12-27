'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { formatMaturityIndex, getMaturityLabel, maturityIndexToPercentage } from '@/lib/scoring-utils'

import KPICards from '@/components/KPICards'
import RadarChartComponent from '@/components/RadarChartComponent'

const DEMO_ASSESSMENT_ID = 'b4b63b9b-4412-4628-8a9a-527b0696426a'

/**
 * IMPORTANTE:
 * En BD, dimension_id es UUID (dts_dimensions.id).
 * En UI usamos slugs: strategy/customer/technology/operations/culture/data
 */
const DIM_UUID_TO_SLUG: Record<
  string,
  'strategy' | 'customer' | 'technology' | 'operations' | 'culture' | 'data'
> = {
  '3f297a88-986e-4c1e-9fcf-5601e32fd4f6': 'strategy',
  '08e1e35b-2fa5-44ee-894e-22438c0be0bc': 'customer',
  'da44a7c4-09d4-4f87-845d-fb3cf8a60d24': 'technology',
  'a592fa3e-560c-4156-bb00-f63c3a526bed': 'operations',
  '2e19a5e9-f076-431d-bfa6-9558e475f7a4': 'culture',
  '64114d4b-3785-483b-b54c-94438091377c': 'data',
}

const SLUG_LABELS: Record<string, string> = {
  strategy: 'Estrategia',
  customer: 'Cliente',
  technology: 'Tecnología',
  operations: 'Operaciones',
  culture: 'Cultura',
  data: 'Datos',
}

type ApiScoreGetResponse = {
  ok: boolean
  requestId: string
  assessmentScore: {
    assessment_id: string
    answered_count: number
    total_count: number
    as_is_avg: number // 1-5
    to_be_avg: number // 1-5
    gap_avg: number
    weighted_gap_avg: number
    updated_at: string
  } | null
  dimensionScores: Array<{
    assessment_id: string
    dimension_id: string // UUID
    answered_count: number
    total_count: number
    as_is_avg: number // 1-5
    to_be_avg: number // 1-5
    gap_avg: number
    weighted_gap_avg: number
    updated_at: string
  }>
  error?: string
}

interface DimensionScoreUI {
  dimension: string // slug
  maturityIndex: number // 1-5 (as_is_avg)
  asIs: number // legacy 0-100 derivado (solo para UI)
  toBe: number // legacy 0-100 derivado (solo para UI)
  gap: number // legacy points (toBe% - asIs%)
}

export default function ResultadosPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('Tu Empresa')

  // Global (viene de backend)
  const [globalMaturityIndex, setGlobalMaturityIndex] = useState(0)
  const [maturityLabel, setMaturityLabel] = useState('')
  const [globalScore, setGlobalScore] = useState(0)

  // Dimensiones (viene de backend)
  const [dimensionScores, setDimensionScores] = useState<DimensionScoreUI[]>([])

  const isDemo = useMemo(() => {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('demo') === '1'
  }, [])

  const assessmentId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return isDemo ? DEMO_ASSESSMENT_ID : localStorage.getItem('dts_assessment_id')
  }, [isDemo])

  useEffect(() => {
    void loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchScoresFromApi = async (assessmentId: string) => {
    const url = `/api/dts/score/get?assessmentId=${encodeURIComponent(assessmentId)}`
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    const json = (await res.json()) as ApiScoreGetResponse

    if (!res.ok || !json.ok) {
      throw new Error(json?.error || `Error en score/get (HTTP ${res.status})`)
    }
    return json
  }

  const loadResults = async () => {
    try {
      if (!assessmentId) {
        router.push('/diagnostico-full')
        return
      }

      // 1) Nombre de empresa (solo lectura)
      const { data: assessment, error: assessmentError } = await supabase
        .from('dts_assessments')
        .select('onboarding_data')
        .eq('id', assessmentId)
        .single()

      if (!assessmentError && (assessment as any)?.onboarding_data?.companyName) {
        setCompanyName((assessment as any).onboarding_data.companyName)
      }

      // 2) Scores (backend manda)
      const scoreApi = await fetchScoresFromApi(assessmentId)
      if (!scoreApi.assessmentScore) {
        throw new Error('No hay assessmentScore en /api/dts/score/get')
      }

      const globalMaturity = Number(scoreApi.assessmentScore.as_is_avg) // 1-5
      setGlobalMaturityIndex(globalMaturity)
      setMaturityLabel(getMaturityLabel(globalMaturity))
      setGlobalScore(Math.round(maturityIndexToPercentage(globalMaturity)))

      const radarScores: DimensionScoreUI[] = scoreApi.dimensionScores.map((d) => {
        const slug = DIM_UUID_TO_SLUG[d.dimension_id] ?? 'strategy'
        const asIsPct = maturityIndexToPercentage(Number(d.as_is_avg))
        const toBePct = maturityIndexToPercentage(Number(d.to_be_avg))

        return {
          dimension: slug,
          maturityIndex: Number(d.as_is_avg),
          asIs: Math.round(asIsPct),
          toBe: Math.round(toBePct),
          gap: Math.round(toBePct - asIsPct),
        }
      })

      setDimensionScores(radarScores)
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Error loading results:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  const criticalDimension =
    dimensionScores.length > 0
      ? dimensionScores.reduce((min, cur) => (cur.maturityIndex < min.maturityIndex ? cur : min), dimensionScores[0])
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resultados del Diagnóstico</h1>
              <p className="text-gray-600 mt-1">{companyName} - Evaluación TM Forum DMM v5.0.1</p>
            </div>

            <button
              onClick={() => router.push(isDemo ? '/diagnostico-full?demo=1' : '/diagnostico-full')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Volver al Diagnóstico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* HERO */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-2">Overall Maturity Index</p>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-6xl font-bold">{formatMaturityIndex(globalMaturityIndex, 1)}</div>
              <div className="text-left">
                <div className="text-2xl font-semibold">{maturityLabel}</div>
                <div className="text-blue-200 text-sm">({globalScore}%)</div>
              </div>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl mx-auto">
              Score leído del backend (persistido en dts_assessment_scores / dts_dimension_scores).
            </p>
          </div>
        </div>

        {/* KPI Cards (sin cálculos extra: ponemos 0 donde antes dependía de efforts) */}
        <KPICards
          globalScore={globalScore}
          totalInitiatives={0}
          criticalDimension={criticalDimension ? SLUG_LABELS[criticalDimension.dimension] : 'N/A'}
          quickWins={0}
        />

        {/* Radar */}
        <RadarChartComponent scores={dimensionScores} />

        {/* Cards por dimensión */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Madurez por Dimensión</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimensionScores.map((dim, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-3">{SLUG_LABELS[dim.dimension] || dim.dimension}</h3>

                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Maturity Index:</span>
                      <span className="text-2xl font-bold text-blue-600">{formatMaturityIndex(dim.maturityIndex, 1)}</span>
                    </div>
                    <div className="text-xs text-blue-700 mt-1">{getMaturityLabel(dim.maturityIndex)}</div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>AS-IS (0-100):</span>
                      <span className="font-semibold text-amber-600">{dim.asIs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>TO-BE (0-100):</span>
                      <span className="font-semibold text-blue-600">{dim.toBe}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span>Gap:</span>
                      <span className={`font-semibold ${dim.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {dim.gap > 0 ? '+' : ''}
                        {dim.gap} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nota técnica clara */}
          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Nota:</p>
            <p>
              Esta pantalla ya no calcula nada “crítico” en el navegador. Si quieres volver a mostrar HeatMap/Timeline/Roadmap
              <strong> sin cálculo frontend</strong>, toca exponer un endpoint backend que devuelva iniciativas ya agregadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
