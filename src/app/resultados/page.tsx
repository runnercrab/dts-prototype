'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  calculateAllDimensionScores,
  calculateGlobalScore,
  calculateAllEfforts,
  generateRoadmap,
  type DimensionScore,
  type EffortResult,
  type RoadmapPhase,
  type Criterion,
  type CriterionResponse
} from '@/lib/scoring-utils'

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState('')
  const [numEmployees, setNumEmployees] = useState(10)
  
  // Scores
  const [globalScore, setGlobalScore] = useState(0)
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([])
  
  // Efforts
  const [efforts, setEfforts] = useState<EffortResult[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([])
  
  // Data
  const [responses, setResponses] = useState<CriterionResponse[]>([])
  const [criteria, setCriteria] = useState<Criterion[]>([])

  useEffect(() => {
    loadResultsData()
  }, [])

  async function loadResultsData() {
    try {
      
      // 1. Obtener assessment ID
      const savedId = localStorage.getItem('dts_assessment_id')
      if (!savedId) {
        console.error('❌ No assessment ID found')
        router.push('/diagnostico-full')
        return
      }
      
      setAssessmentId(savedId)

      // 2. Cargar assessment para obtener contexto (empresa, sector, etc.)
      const { data: assessment } = await supabase
        .from('dts_assessments')
        .select('onboarding_data')
        .eq('id', savedId)
        .single()

      if (assessment?.onboarding_data) {
        setCompanyName(assessment.onboarding_data.companyName || 'Tu empresa')
        setSector(assessment.onboarding_data.sector || 'Tecnología y Software')
        setNumEmployees(assessment.onboarding_data.numEmployees || 10)
      }

      // 3. Cargar criterios
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('dts_criteria')
        .select(`
          id, code, subdimension_id,
          dts_subdimensions!inner (
            id, code,
            dts_dimensions!inner (id, code)
          )
        `)
        .in('tier', ['tier1', 'tier2'])
        .order('code')

      if (criteriaError) {
        console.error('❌ Error loading criteria:', criteriaError)
        throw criteriaError
      }

      if (!criteriaData || criteriaData.length === 0) {
        console.error('❌ No criteria found')
        return
      }

      // Transformar a formato simple con mapeo de dimensiones
      const DIMENSION_CODE_MAP: Record<string, string> = {
        'd1': 'strategy',
        'd2': 'customer', 
        'd3': 'technology',
        'd4': 'operations',
        'd5': 'culture',
        'd6': 'data'
      }
      
      const transformedCriteria = criteriaData.map((c: any) => {
        const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions
        const dimension = subdimension?.dts_dimensions
        const dimensionObj = Array.isArray(dimension) ? dimension[0] : dimension
        
        // Convertir dimension code (d1-d6) a nombre (strategy, customer, etc.)
        const dimensionCode = (dimensionObj?.code || '').toLowerCase()
        const dimensionName = DIMENSION_CODE_MAP[dimensionCode] || dimensionCode
        
        return {
          id: c.id,
          code: c.code,
          dimension_id: dimensionName, // Usar nombre mapeado
          subdimension_id: c.subdimension_id,
          title: c.code // Usamos code como título por ahora
        }
      })

      setCriteria(transformedCriteria)
      
      console.log('🔍 DEBUG - Criterios cargados:', transformedCriteria.length)
      console.log('🔍 DEBUG - Primer criterio:', transformedCriteria[0])
      console.log('🔍 DEBUG - Dimension IDs únicos:', [...new Set(transformedCriteria.map(c => c.dimension_id))])

      // 4. Cargar respuestas
      const { data: responsesData } = await supabase
        .from('dts_responses')
        .select('criteria_id, as_is_level, to_be_level, importance, to_be_timeframe')
        .eq('assessment_id', savedId)

      if (!responsesData || responsesData.length === 0) {
        console.error('❌ No responses found')
        return
      }

      setResponses(responsesData)

      console.log('🔍 DEBUG - Respuestas:', responsesData.length)
      console.log('🔍 DEBUG - Primera respuesta:', responsesData[0])

      // 5. Calcular scores
      const dimScores = calculateAllDimensionScores(responsesData, transformedCriteria)
      console.log('🔍 DEBUG - Dimension scores calculados:', dimScores)
      setDimensionScores(dimScores)
      
      const global = calculateGlobalScore(dimScores)
      setGlobalScore(global)

      // 6. Calcular efforts
      const effortsData = calculateAllEfforts(
        responsesData,
        transformedCriteria,
        assessment?.onboarding_data?.numEmployees || 10,
        assessment?.onboarding_data?.sector || 'Tecnología y Software',
        global
      )
      setEfforts(effortsData)

      // 7. Generar roadmap
      const roadmapData = generateRoadmap(responsesData, transformedCriteria, effortsData)
      setRoadmap(roadmapData)

      console.log('✅ Results loaded:', {
        globalScore: global,
        dimensionScores: dimScores,
        efforts: effortsData.length,
        roadmap: roadmapData
      })

    } catch (error) {
      console.error('❌ Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    if (score >= 25) return 'text-orange-600'
    return 'text-red-600'
  }

  function getScoreLabel(score: number): string {
    if (score >= 75) return 'Optimizado'
    if (score >= 50) return 'Gestionado'
    if (score >= 25) return 'Definido'
    return 'Emergente'
  }

  function getCategoryColor(category: string): string {
    switch(category) {
      case 'Quick Win': return 'bg-green-100 text-green-800'
      case 'Transformacional': return 'bg-purple-100 text-purple-800'
      case 'Foundation': return 'bg-blue-100 text-blue-800'
      case 'Mantenimiento': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando resultados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Resultados del Diagnóstico
              </h1>
              <p className="text-gray-600 mt-1">{companyName}</p>
            </div>
            <button
              onClick={() => router.push('/diagnostico-full')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              ← Volver al diagnóstico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Score Global */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Tu Madurez Digital Global</p>
            <div className={`text-7xl font-bold mb-4 ${getScoreColor(globalScore)}`}>
              {globalScore.toFixed(0)}
              <span className="text-3xl text-gray-400">/100</span>
            </div>
            <p className={`text-2xl font-semibold ${getScoreColor(globalScore)}`}>
              Nivel {getScoreLabel(globalScore)}
            </p>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
              Tu organización ha alcanzado un nivel de madurez digital {getScoreLabel(globalScore).toLowerCase()}, 
              con oportunidades de mejora identificadas en {efforts.filter(e => e.gap_levels > 0).length} criterios.
            </p>
          </div>
        </div>

        {/* Scores por Dimensión */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Scores por Dimensión
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dimensionScores.map(dim => (
              <div key={dim.dimension_id} className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">{dim.dimension_name}</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>AS-IS</span>
                    <span className={getScoreColor(dim.as_is_score)}>
                      {dim.as_is_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${dim.as_is_score}%` }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>TO-BE</span>
                    <span className={getScoreColor(dim.to_be_score)}>
                      {dim.to_be_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${dim.to_be_score}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-gray-500">Brecha:</span>
                  <span className="font-semibold text-orange-600">
                    +{dim.gap.toFixed(0)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Brechas - Quick Wins */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎯 Quick Wins - Prioridad Alta
          </h2>
          <p className="text-gray-600 mb-6">
            Estos criterios tienen alto impacto y bajo esfuerzo. Son tus mejores oportunidades para obtener resultados rápidos.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Criterio</th>
                  <th className="text-center py-3 px-4">Impact</th>
                  <th className="text-center py-3 px-4">Effort</th>
                  <th className="text-center py-3 px-4">Priority</th>
                  <th className="text-center py-3 px-4">Categoría</th>
                </tr>
              </thead>
              <tbody>
                {efforts
                  .filter(e => e.category === 'Quick Win')
                  .sort((a, b) => b.priority_score - a.priority_score)
                  .slice(0, 10)
                  .map(effort => {
                    const criterion = criteria.find(c => c.id === effort.criteria_id)
                    return (
                      <tr key={effort.criteria_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{criterion?.code}</div>
                          <div className="text-sm text-gray-600">{criterion?.title}</div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold text-green-600">
                            {effort.impact.toFixed(0)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold text-blue-600">
                            {effort.effort_final.toFixed(0)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold text-purple-600">
                            {effort.priority_score.toFixed(0)}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(effort.category)}`}>
                            {effort.category}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roadmap 30/60/90 días */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🗺️ Roadmap de Transformación
          </h2>
          <p className="text-gray-600 mb-8">
            Plan de acción recomendado basado en impacto y esfuerzo estimado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.map(phase => (
              <div key={phase.phase} className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {phase.phase === '30-days' && '🚀 Primeros 30 días'}
                  {phase.phase === '60-days' && '📈 30-60 días'}
                  {phase.phase === '90-days' && '🎯 60-90 días'}
                </h3>
                
                <div className="space-y-3">
                  {phase.criteria.slice(0, 5).map(item => (
                    <div key={item.criterion.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <div className="font-medium text-sm">{item.criterion.code}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {item.criterion.title}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(item.effort.category)}`}>
                          {item.effort.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          Impact: {item.effort.impact.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {phase.criteria.length > 5 && (
                  <p className="text-sm text-gray-500 mt-4">
                    +{phase.criteria.length - 5} criterios más
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de Esfuerzos */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Distribución de Iniciativas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Quick Win', 'Foundation', 'Transformacional', 'Mantenimiento'].map(cat => {
              const count = efforts.filter(e => e.category === cat).length
              const percentage = (count / efforts.length * 100).toFixed(0)
              
              return (
                <div key={cat} className="text-center p-4 border rounded-lg">
                  <div className={`text-3xl font-bold mb-2 ${getCategoryColor(cat)}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{cat}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
