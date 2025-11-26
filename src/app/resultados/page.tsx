'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateAllDimensionScores, calculateAllEfforts, generateRoadmap, type DimensionScore as DimScoreType, type EffortResult } from '@/lib/scoring-utils'
import KPICards from '@/components/KPICards'
import RadarChartComponent from '@/components/RadarChartComponent'

interface DimensionScore {
  dimension: string
  asIs: number
  toBe: number
  gap: number
}

interface RoadmapPhase {
  phase: string
  criteria: any[]
}

export default function ResultadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [globalScore, setGlobalScore] = useState(0)
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([])
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    loadResults()
  }, [])

  const categorizeCriterion = (impact: number, effort: number): string => {
    if (impact >= 25 && effort <= 50) return 'Quick Win'
    if (impact >= 40 || (impact >= 25 && effort > 50)) return 'Transformacional'
    if (impact >= 15 && impact < 40 && effort <= 70) return 'Foundation'
    return 'Mantenimiento'
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
      
      // JOIN TRIPLE para obtener el código de dimensión
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
      console.log('📋 Primer criterio completo:', JSON.stringify(allCriteriaData[0], null, 2))
      console.log('📋 Código de dimensión:', allCriteriaData[0]?.dts_subdimensions?.dts_dimensions?.code)

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

      // Mapeo de códigos BD (D1-D6) a códigos TM Forum
      const dimensionCodeMap: Record<string, string> = {
        'D1': 'strategy',
        'D2': 'customer',
        'D3': 'technology',
        'D4': 'operations',
        'D5': 'culture',
        'D6': 'data'
      }

      // Preparar criteria con el código correcto de dimensión
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

      console.log('📊 Primer criterio mapeado:', criteria[0])
      console.log('📊 Dimension IDs únicos (convertidos):', [...new Set(criteria.map(c => c.dimension_id))])
      console.log('📊 Conversión ejemplo: D1 →', dimensionCodeMap['D1'])

      const responses = responsesData.map(r => ({
        criteria_id: r.criteria_id,
        as_is_level: r.as_is_level,
        to_be_level: r.to_be_level,
        importance: r.importance || 3,
        to_be_timeframe: r.to_be_timeframe || 2
      }))

      console.log('📊 Primera respuesta:', responses[0])

      const dimScores = calculateAllDimensionScores(responses, criteria)
      
      console.log('📈 Scores calculados:', dimScores)
      
      let gScore = 0
      dimScores.forEach(dim => {
        gScore += dim.as_is_score * dim.weight
      })
      
      console.log('🎯 Score global calculado:', gScore)
      
      setGlobalScore(Math.round(gScore))
      
      const radarScores: DimensionScore[] = dimScores.map(d => ({
        dimension: d.dimension_id,
        asIs: Math.round(d.as_is_score),
        toBe: Math.round(d.to_be_score),
        gap: Math.round(d.gap)
      }))
      setDimensionScores(radarScores)

      const efforts = calculateAllEfforts(
        responses,
        criteria,
        assessment?.onboarding_data?.employees || 50,
        assessment?.onboarding_data?.sector || 'Technology',
        gScore
      )

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
    current.asIs < min.asIs ? current : min
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <KPICards
          globalScore={globalScore}
          totalInitiatives={totalInitiatives}
          criticalDimension={dimensionLabels[criticalDimension?.dimension] || 'N/A'}
          quickWins={quickWins}
        />

        <RadarChartComponent scores={dimensionScores} />

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📈 Scores por Dimensión
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">AS-IS:</span>
                    <span className="font-bold text-amber-600">{dim.asIs}/100</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">TO-BE:</span>
                    <span className="font-bold text-blue-600">{dim.toBe}/100</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Gap:</span>
                    <span className={`font-bold ${dim.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {dim.gap > 0 ? '+' : ''}{dim.gap} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🗺️ Roadmap 30/60/90 Días
          </h2>
          
          <div className="space-y-6">
            {roadmap.map((phase, index) => {
              const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
                '30': { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
                '60': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
                '90': { bg: '#e9d5ff', text: '#6b21a8', border: '#a855f7' }
              }
              
              const color = phaseColors[phase.phase]
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="px-4 py-2 rounded-lg font-bold"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text
                      }}
                    >
                      {phase.phase} días
                    </div>
                    <div className="text-sm text-gray-600">
                      {phase.criteria.length} iniciativas
                    </div>
                  </div>
                  
                  {phase.criteria.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.criteria.slice(0, 6).map((criterion, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded p-3 text-sm"
                        >
                          <div className="font-semibold text-gray-800 mb-1">
                            {criterion.code}
                          </div>
                          <div className="text-gray-600 text-xs">
                            Impact: {Math.round(criterion.impact)} | Effort: {Math.round(criterion.effort)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No hay iniciativas planificadas para esta fase
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
