'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  calculateAllDimensionScores, 
  calculateAllEfforts, 
  generateRoadmap, 
  calculateGlobalScore,
  formatMaturityIndex,
  getMaturityLabel,
  maturityIndexToPercentage,
  type DimensionScore as DimScoreType, 
  type EffortResult 
} from '@/lib/scoring-utils'
import KPICards from '@/components/KPICards'
import RadarChartComponent from '@/components/RadarChartComponent'
import HeatMapChart from '@/components/HeatMapChart'
import TimelineRoadmap from '@/components/TimelineRoadmap'

interface DimensionScore {
  dimension: string
  maturityIndex: number  // NUEVO: 1-5 scale
  asIs: number          // Legacy: 0-100 scale
  toBe: number
  gap: number
}

interface RoadmapPhase {
  phase: string
  criteria: any[]
}

interface HeatMapCriterion {
  id: string
  code: string
  title: string
  dimension: string
  importance: number
  effort: number
  gap: number
  category: 'quick-win' | 'foundation' | 'transformational' | 'maintenance'
}

interface TimelineInitiative {
  id: string
  code: string
  title: string
  dimension: string
  timeframe: '6months' | '1year' | '2years' | '3years+'
  importance: number
  gap: number
}

export default function ResultadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // NUEVO: Maturity Index (1-5)
  const [globalMaturityIndex, setGlobalMaturityIndex] = useState(0)
  const [maturityLabel, setMaturityLabel] = useState('')
  
  // Legacy: Para compatibilidad
  const [globalScore, setGlobalScore] = useState(0)
  
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [companyName, setCompanyName] = useState('')
  
  const [heatMapData, setHeatMapData] = useState<HeatMapCriterion[]>([])
  const [timelineData, setTimelineData] = useState<TimelineInitiative[]>([])

  useEffect(() => {
    loadResults()
  }, [])

  const categorizeCriterion = (impact: number, effort: number): string => {
    if (impact >= 25 && effort <= 50) return 'Quick Win'
    if (impact >= 40 || (impact >= 25 && effort > 50)) return 'Transformacional'
    if (impact >= 15 && impact < 40 && effort <= 70) return 'Foundation'
    return 'Mantenimiento'
  }

  const categorizeCriterionForHeatMap = (impact: number, effort: number): 'quick-win' | 'foundation' | 'transformational' | 'maintenance' => {
    if (impact >= 25 && effort <= 50) return 'quick-win'
    if (impact >= 40 || (impact >= 25 && effort > 50)) return 'transformational'
    if (impact >= 15 && impact < 40 && effort <= 70) return 'foundation'
    return 'maintenance'
  }

  const loadResults = async () => {
    try {
      const assessmentId = localStorage.getItem('dts_assessment_id')
      
      if (!assessmentId) {
        router.push('/diagnostico-full')
        return
      }

      console.log('🔍 Assessment ID:', assessmentId)

      const { data: assessment } = await supabase
        .from('dts_assessments')
        .select('onboarding_data')
        .eq('id', assessmentId)
        .single()

      if (assessment?.onboarding_data) {
        setCompanyName(assessment.onboarding_data.companyName || 'Tu Empresa')
      }

      console.log('🔍 Cargando criterios con dimensiones...')
      
      const { data: allCriteriaData, error: allCriteriaError } = await supabase
        .from('dts_criteria')
        .select(`
          id,
          code,
          short_label,
          subdimension_id,
          dts_subdimensions!inner (
            id,
            dimension_id,
            dts_dimensions!inner (
              id,
              code
            )
          )
        `)
        .in('tier', ['tier1', 'tier2'])

      if (allCriteriaError) {
        console.error('❌ Error cargando criterios:', allCriteriaError)
        throw new Error(`Error cargando criterios: ${allCriteriaError.message}`)
      }
      
      console.log('✅ Criterios cargados:', allCriteriaData?.length || 0)

      console.log('🔍 Cargando respuestas para assessment:', assessmentId)
      const { data: responsesData, error: responsesError } = await supabase
        .from('dts_responses')
        .select('*')
        .eq('assessment_id', assessmentId)

      if (responsesError) {
        console.error('❌ Error cargando respuestas:', responsesError)
        throw new Error(`Error cargando respuestas: ${responsesError.message}`)
      }
      
      console.log('✅ Respuestas cargadas:', responsesData?.length || 0)

      if (!allCriteriaData || allCriteriaData.length === 0) {
        throw new Error('No se encontraron criterios en la base de datos')
      }
      
      if (!responsesData || responsesData.length === 0) {
        throw new Error('No se encontraron respuestas para este assessment')
      }

      const dimensionCodeMap: Record<string, string> = {
        'D1': 'strategy',
        'D2': 'customer',
        'D3': 'technology',
        'D4': 'operations',
        'D5': 'culture',
        'D6': 'data'
      }

      const criteria = allCriteriaData.map(c => {
        const dbCode = c.dts_subdimensions?.dts_dimensions?.code || 'D1'
        const tmForumCode = dimensionCodeMap[dbCode] || 'strategy'
        
        return {
          id: c.id,
          code: c.code,
          dimension_id: tmForumCode,
          subdimension_id: c.subdimension_id,
          title: c.short_label || c.code
        }
      })

      const responses = responsesData.map(r => ({
        criteria_id: r.criteria_id,
        as_is_level: r.as_is_level,
        to_be_level: r.to_be_level,
        importance: r.importance || 3,
        to_be_timeframe: r.to_be_timeframe || '1year'
      }))

      // ============================================
      // NUEVO: Calcular con metodología TM Forum
      // ============================================
      
      const dimScores = calculateAllDimensionScores(responses, criteria)
      
      // Score global usando NUEVA metodología (1-5)
      const globalMaturity = calculateGlobalScore(dimScores)
      setGlobalMaturityIndex(globalMaturity)
      setMaturityLabel(getMaturityLabel(globalMaturity))
      
      // Score legacy (0-100) para KPI cards
      const legacyScore = maturityIndexToPercentage(globalMaturity)
      setGlobalScore(Math.round(legacyScore))
      
      console.log(`✅ Global Maturity Index: ${globalMaturity.toFixed(2)}/5 (${maturityLabel})`)
      console.log(`   Legacy score: ${legacyScore.toFixed(1)}%`)
      
      // Preparar scores para visualización
      const radarScores: DimensionScore[] = dimScores.map(d => ({
        dimension: d.dimension_id,
        maturityIndex: d.maturity_index,  // NUEVO
        asIs: Math.round(d.as_is_score),  // Legacy
        toBe: Math.round(d.to_be_score),  // Legacy
        gap: Math.round(d.gap)            // Legacy
      }))
      setDimensionScores(radarScores)

      // ============================================
      // Calcular efforts (usa globalMaturity 1-5)
      // ============================================
      
      const efforts = calculateAllEfforts(
        responses,
        criteria,
        assessment?.onboarding_data?.employees || 50,
        assessment?.onboarding_data?.sector || 'Technology',
        globalMaturity  // Ahora pasa 1-5
      )

      // Preparar datos para HeatMap
      const heatMapCriteria: HeatMapCriterion[] = efforts.map(effort => {
        const criterion = criteria.find(c => c.id === effort.criteria_id)!
        const response = responses.find(r => r.criteria_id === effort.criteria_id)!
        const gap = response.to_be_level - response.as_is_level
        
        const normalizedImportance = response.importance
        const normalizedEffort = Math.min(5, Math.max(1, Math.round((effort.effort_final / 20))))
        
        return {
          id: criterion.id,
          code: criterion.code,
          title: criterion.title,
          dimension: criterion.dimension_id,
          importance: normalizedImportance,
          effort: normalizedEffort,
          gap: gap,
          category: categorizeCriterionForHeatMap(effort.impact, effort.effort_final)
        }
      })
      setHeatMapData(heatMapCriteria)

      // Preparar datos para Timeline
      const timelineInitiatives: TimelineInitiative[] = efforts
        .filter(effort => {
          const response = responses.find(r => r.criteria_id === effort.criteria_id)!
          return response.to_be_level > response.as_is_level
        })
        .map(effort => {
          const criterion = criteria.find(c => c.id === effort.criteria_id)!
          const response = responses.find(r => r.criteria_id === effort.criteria_id)!
          
          let timeframe: '6months' | '1year' | '2years' | '3years+'
          if (effort.category === 'Quick Win') {
            timeframe = '6months'
          } else if (effort.category === 'Foundation') {
            timeframe = '1year'
          } else {
            timeframe = '2years'
          }
          
          return {
            id: criterion.id,
            code: criterion.code,
            title: criterion.title,
            dimension: criterion.dimension_id,
            timeframe: timeframe,
            importance: response.importance,
            gap: response.to_be_level - response.as_is_level
          }
        })
      setTimelineData(timelineInitiatives)

      const roadmapData = generateRoadmap(responses, criteria, efforts)
      
      const formattedRoadmap: RoadmapPhase[] = roadmapData.map(phase => {
        const phaseNumber = phase.phase === '30-days' ? '30' : phase.phase === '60-days' ? '60' : '90'
        return {
          phase: phaseNumber,
          criteria: phase.criteria.map(item => ({
            code: item.criterion.code,
            impact: item.effort.impact,
            effort: item.effort.effort_final
          }))
        }
      })
      setRoadmap(formattedRoadmap)

      const dist: Record<string, number> = {
        'Quick Win': 0,
        'Foundation': 0,
        'Transformacional': 0,
        'Mantenimiento': 0
      }

      efforts.forEach(effort => {
        const category = categorizeCriterion(effort.impact, effort.effort_final)
        dist[category] = (dist[category] || 0) + 1
      })

      setDistribution(dist)
      setLoading(false)

    } catch (error) {
      console.error('Error loading results:', error)
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

  const criticalDimension = dimensionScores.reduce((min, current) => 
    current.maturityIndex < min.maturityIndex ? current : min
  , dimensionScores[0])

  const dimensionLabels: Record<string, string> = {
    'strategy': 'Estrategia',
    'customer': 'Cliente',
    'technology': 'Tecnología',
    'operations': 'Operaciones',
    'culture': 'Cultura',
    'data': 'Datos'
  }

  const totalInitiatives = dimensionScores.reduce((sum, d) => sum + (d.gap > 0 ? 1 : 0), 0) * 21
  const quickWins = distribution['Quick Win'] || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Resultados del Diagnóstico
              </h1>
              <p className="text-gray-600 mt-1">
                {companyName} - Evaluación TM Forum DMM v5.0.1
              </p>
            </div>
            <button
              onClick={() => router.push('/diagnostico-full')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Volver al Diagnóstico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* ============================================ */}
        {/* NUEVO: Maturity Index Hero Section */}
        {/* ============================================ */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide mb-2">
              Overall Maturity Index
            </p>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-6xl font-bold">
                {formatMaturityIndex(globalMaturityIndex, 1)}
              </div>
              <div className="text-left">
                <div className="text-2xl font-semibold">
                  {maturityLabel}
                </div>
                <div className="text-blue-200 text-sm">
                  ({globalScore}%)
                </div>
              </div>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl mx-auto">
              Basado en la metodología oficial TM Forum DMM v5.0.1
            </p>
          </div>
        </div>

        {/* KPI Cards - Mantener para compatibilidad */}
        <KPICards
          globalScore={globalScore}
          totalInitiatives={totalInitiatives}
          criticalDimension={dimensionLabels[criticalDimension?.dimension] || 'N/A'}
          quickWins={quickWins}
        />

        {/* Radar Chart - Actualizar para usar maturity index */}
        <RadarChartComponent scores={dimensionScores} />

        {/* Heat Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🎯 Matriz de Priorización: Impacto vs Esfuerzo
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Visualiza las {heatMapData.length} iniciativas según su impacto y esfuerzo requerido
          </p>
          <HeatMapChart criteria={heatMapData} />
        </div>

        {/* Timeline Roadmap */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🗓️ Roadmap de Implementación 30/60/90 Días
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Plan de acción organizado por fases temporales
          </p>
          <TimelineRoadmap initiatives={timelineData} />
        </div>

        {/* ============================================ */}
        {/* ACTUALIZADO: Scores por Dimensión */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📈 Madurez por Dimensión
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimensionScores.map((dim, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-800 mb-3">
                  {dimensionLabels[dim.dimension]}
                </h3>
                
                <div className="space-y-3">
                  {/* NUEVO: Maturity Index destacado */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Maturity Index:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatMaturityIndex(dim.maturityIndex, 1)}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {getMaturityLabel(dim.maturityIndex)}
                    </div>
                  </div>
                  
                  {/* Legacy scores (smaller) */}
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
                        {dim.gap > 0 ? '+' : ''}{dim.gap} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Iniciativas - Sin cambios */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🎯 Distribución de Iniciativas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(distribution).map(([category, count]) => {
              const colors: Record<string, { bg: string; text: string; border: string }> = {
                'Quick Win': { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
                'Foundation': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
                'Transformacional': { bg: '#e9d5ff', text: '#6b21a8', border: '#a855f7' },
                'Mantenimiento': { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' }
              }
              
              const color = colors[category]
              
              return (
                <div
                  key={category}
                  className="border-2 rounded-lg p-4 text-center"
                  style={{ 
                    backgroundColor: color.bg,
                    borderColor: color.border
                  }}
                >
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: color.text }}
                  >
                    {count}
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: color.text }}
                  >
                    {category}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round((count / 129) * 100)}% del total
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
