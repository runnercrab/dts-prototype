'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AvatarPane from '@/components/AvatarPane'
import AssistantChat from '@/components/AssistantChat'
import OnboardingWorkshop from '@/components/diagnostico/OnboardingWorkshop'
import DimensionProgressMap from '@/components/diagnostico/DimensionProgressMapVisual'
import CriterionQuestion from '@/components/diagnostico/CriterionQuestion'
import bus from '@/lib/bus'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Tipos
interface Criterion {
  id: string
  code: string
  description: string
  short_label: string
  focus_area: string
  context?: string
  subdimension_id: string
  subdimension?: {
    name: string
    code: string
    dimension_name: string
  }
  dimension?: {
    name: string
    code: string
  }
}

interface Response {
  as_is_level: number
  as_is_confidence: 'low' | 'medium' | 'high'
  as_is_notes?: string
  to_be_level: number
  to_be_timeframe: '6months' | '1year' | '2years' | '3years+'
  importance: number
}

interface Subdimension {
  id: string
  code: string
  name: string
  dimension_name: string
  total_criteria: number
  completed_criteria: number
  is_completed: boolean
  is_current: boolean
}

export default function DiagnosticoFullPage() {
  // Estados principales
  const [phase, setPhase] = useState<'onboarding' | 'assessment' | 'completed'>('onboarding')
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(true)
  
  // Datos del assessment
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([])
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, Response>>(new Map())
  
  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar criterios TIER 1 desde Supabase
  const loadTier1Criteria = async (assessmentId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Cargando criterios para assessment:', assessmentId)

      // Obtener el DMM version ID del assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('dts_assessments')
        .select('dmm_version_id')
        .eq('id', assessmentId)
        .single()

      if (assessmentError) {
        console.error('❌ Error obteniendo assessment:', assessmentError)
        throw assessmentError
      }

      console.log('✅ Assessment encontrado, dmm_version_id:', assessment.dmm_version_id)

      // Cargar criterios TIER 1
      console.log('🔍 Buscando criterios TIER 1...')
      
      // PASO 1: Cargar criterios básicos
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('dts_criteria')
        .select('id, code, description, short_label, focus_area, context, subdimension_id')
        .eq('dmm_version_id', assessment.dmm_version_id)
        .eq('tier', 'tier1')
        .order('code')

      if (criteriaError) {
        console.error('❌ Error cargando criterios:', criteriaError)
        throw new Error(`Error cargando criterios: ${criteriaError.message}`)
      }

      console.log('✅ Criterios base cargados:', criteriaData?.length || 0)

      // PASO 2: Cargar subdimensiones
      const subdimensionIds = [...new Set(criteriaData.map(c => c.subdimension_id))]
      const { data: subdimensionsData, error: subError } = await supabase
        .from('dts_subdimensions')
        .select('id, code, name, dimension_id')
        .in('id', subdimensionIds)

      if (subError) {
        console.error('❌ Error cargando subdimensiones:', subError)
        throw new Error(`Error cargando subdimensiones: ${subError.message}`)
      }

      console.log('✅ Subdimensiones cargadas:', subdimensionsData?.length || 0)

      // PASO 3: Cargar dimensiones
      const dimensionIds = [...new Set(subdimensionsData.map(s => s.dimension_id))]
      const { data: dimensionsData, error: dimError } = await supabase
        .from('dts_dimensions')
        .select('id, code, name')
        .in('id', dimensionIds)

      if (dimError) {
        console.error('❌ Error cargando dimensiones:', dimError)
        throw new Error(`Error cargando dimensiones: ${dimError.message}`)
      }

      console.log('✅ Dimensiones cargadas:', dimensionsData?.length || 0)

      // PASO 4: Crear mapas para búsqueda rápida
      const subdimensionsMap = new Map(subdimensionsData.map(s => [s.id, s]))
      const dimensionsMap = new Map(dimensionsData.map(d => [d.id, d]))

      // PASO 5: Combinar datos
      const transformedCriteria: Criterion[] = criteriaData.map((c: any) => {
        const sub = subdimensionsMap.get(c.subdimension_id)
        const dim = sub ? dimensionsMap.get(sub.dimension_id) : null

        return {
          id: c.id,
          code: c.code,
          description: c.description,
          short_label: c.short_label,
          focus_area: c.focus_area,
          context: c.context,
          subdimension_id: c.subdimension_id,
          subdimension: sub ? {
            name: sub.name,
            code: sub.code,
            dimension_name: dim?.name || 'Unknown'
          } : undefined,
          dimension: dim ? {
            name: dim.name,
            code: dim.code
          } : undefined
        }
      })

      console.log('✅ Datos transformados correctamente')
      setCriteria(transformedCriteria)

      // Cargar respuestas existentes
      const { data: existingResponses } = await supabase
        .from('dts_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('response_source', 'manual')

      const responsesMap = new Map<string, Response>()
      if (existingResponses) {
        existingResponses.forEach((r: any) => {
          responsesMap.set(r.criteria_id, {
            as_is_level: r.as_is_level,
            as_is_confidence: r.as_is_confidence,
            as_is_notes: r.as_is_notes,
            to_be_level: r.to_be_level,
            to_be_timeframe: r.to_be_timeframe,
            importance: r.importance
          })
        })
        setResponses(responsesMap)
      }

      // Construir subdimensiones para el mapa
      buildSubdimensionsMap(transformedCriteria, responsesMap)

      // Encontrar el primer criterio sin respuesta
      const firstUnanswered = transformedCriteria.findIndex(c => !responsesMap.has(c.id))
      setCurrentCriterionIndex(firstUnanswered >= 0 ? firstUnanswered : 0)

      setLoading(false)
    } catch (err: any) {
      console.error('❌ Error completo:', err)
      const errorMessage = err?.message || err?.toString() || 'Error desconocido'
      setError(`Error al cargar los criterios: ${errorMessage}`)
      setLoading(false)
    }
  }

  // Construir mapa de subdimensiones con progreso
  const buildSubdimensionsMap = (criteriaList: Criterion[], responsesMap: Map<string, Response>) => {
    const subMap = new Map<string, {
      id: string
      code: string
      name: string
      dimension_name: string
      total: number
      completed: number
    }>()

    criteriaList.forEach(criterion => {
      const subId = criterion.subdimension_id
      if (!subMap.has(subId)) {
        subMap.set(subId, {
          id: subId,
          code: criterion.subdimension?.code || '',
          name: criterion.subdimension?.name || '',
          dimension_name: criterion.dimension?.name || '',
          total: 0,
          completed: 0
        })
      }
      const sub = subMap.get(subId)!
      sub.total++
      if (responsesMap.has(criterion.id)) {
        sub.completed++
      }
    })

    // Convertir a array de Subdimension
    const currentCriterion = criteriaList[currentCriterionIndex]
    const subsArray: Subdimension[] = Array.from(subMap.values()).map(sub => ({
      id: sub.id,
      code: sub.code,
      name: sub.name,
      dimension_name: sub.dimension_name,
      total_criteria: sub.total,
      completed_criteria: sub.completed,
      is_completed: sub.completed === sub.total,
      is_current: currentCriterion?.subdimension_id === sub.id
    }))

    setSubdimensions(subsArray)
  }

  // Manejar completado del onboarding
  const handleOnboardingComplete = async (assessmentId: string) => {
    console.log('📥 Onboarding completado, assessment ID:', assessmentId)
    
    if (!assessmentId || typeof assessmentId !== 'string') {
      console.error('❌ Assessment ID inválido:', assessmentId)
      setError('Error: ID de assessment inválido')
      return
    }
    
    setAssessmentId(assessmentId)
    await loadTier1Criteria(assessmentId)
    setPhase('assessment')
    
    // Notificar al avatar
    bus.emit('avatar:voice', {
      text: '¡Perfecto! Ahora comenzaremos con el diagnóstico completo. Te haré 40 preguntas clave sobre tu madurez digital.'
    })
  }

  // Guardar respuesta
  const handleResponse = async (response: Response) => {
    if (!assessmentId || !criteria[currentCriterionIndex]) return

    const criterion = criteria[currentCriterionIndex]
    
    try {
      // Guardar en Supabase
      const { error } = await supabase
        .from('dts_responses')
        .upsert({
          assessment_id: assessmentId,
          criteria_id: criterion.id,
          as_is_level: response.as_is_level,
          as_is_confidence: response.as_is_confidence,
          as_is_notes: response.as_is_notes,
          to_be_level: response.to_be_level,
          to_be_timeframe: response.to_be_timeframe,
          importance: response.importance,
          response_source: 'manual',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'assessment_id,criteria_id'
        })

      if (error) throw error

      // Actualizar estado local
      const newResponses = new Map(responses)
      newResponses.set(criterion.id, response)
      setResponses(newResponses)

      // Reconstruir mapa de subdimensiones
      buildSubdimensionsMap(criteria, newResponses)

      // Notificar al avatar
      const gap = response.to_be_level - response.as_is_level
      if (gap > 2) {
        bus.emit('avatar:voice', {
          text: `Veo que has identificado un gap significativo de ${gap} niveles. Esto será importante para tu roadmap.`
        })
      }

    } catch (err) {
      console.error('Error saving response:', err)
      setError('Error al guardar la respuesta')
    }
  }

  // Navegación
  const handleNext = () => {
    if (currentCriterionIndex < criteria.length - 1) {
      setCurrentCriterionIndex(currentCriterionIndex + 1)
      setShowMap(false)
    } else {
      // Completado
      completeAssessment()
    }
  }

  const handlePrevious = () => {
    if (currentCriterionIndex > 0) {
      setCurrentCriterionIndex(currentCriterionIndex - 1)
      setShowMap(false)
    }
  }

  const handleSubdimensionClick = (subdimensionId: string) => {
    const firstCriterionIndex = criteria.findIndex(c => c.subdimension_id === subdimensionId)
    if (firstCriterionIndex >= 0) {
      setCurrentCriterionIndex(firstCriterionIndex)
      setShowMap(false)
    }
  }

  // Completar assessment
  const completeAssessment = async () => {
    if (!assessmentId) return

    try {
      // Actualizar assessment como completado
      await supabase
        .from('dts_assessments')
        .update({
          phase_1_completed: true,
          status: 'tier1-completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)

      setPhase('completed')

      bus.emit('avatar:voice', {
        text: '¡Excelente! Has completado las 40 preguntas del TIER 1. Ahora voy a analizar tus respuestas para inferir el resto de criterios automáticamente.'
      })

    } catch (err) {
      console.error('Error completing assessment:', err)
    }
  }

  // Actualizar contexto del avatar cuando cambia el criterio
  useEffect(() => {
    if (phase === 'assessment' && criteria[currentCriterionIndex]) {
      const criterion = criteria[currentCriterionIndex]
      bus.emit('assessment:criterion-changed', {
        criterion: {
          code: criterion.code,
          name: criterion.short_label,
          dimension: criterion.dimension?.name,
          subdimension: criterion.subdimension?.name
        },
        progress: {
          current: currentCriterionIndex + 1,
          total: criteria.length,
          percentage: Math.round(((currentCriterionIndex + 1) / criteria.length) * 100)
        }
      })
    }
  }, [currentCriterionIndex, criteria, phase])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
          
          {/* COLUMNA IZQUIERDA: Avatar + Chat (sticky) - 40% */}
          <div className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <AvatarPane />
              <div className="border-t border-gray-200">
                <AssistantChat />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Contenido dinámico - 60% */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              
              {/* FASE 0: ONBOARDING */}
              {phase === 'onboarding' && (
                <OnboardingWorkshop onComplete={handleOnboardingComplete} />
              )}

              {/* FASE 1: ASSESSMENT */}
              {phase === 'assessment' && (
                <>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-600">Cargando criterios...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      {error}
                    </div>
                  ) : (
                    <>
                      {/* Toggle entre Mapa y Pregunta */}
                      <div className="mb-4 flex justify-between items-center">
                        <button
                          onClick={() => setShowMap(!showMap)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                        >
                          {showMap ? '📝 Ver Pregunta' : '🗺️ Ver Mapa'}
                        </button>
                        <div className="text-sm text-gray-600">
                          {responses.size} / {criteria.length} completadas
                        </div>
                      </div>

                      {showMap ? (
                        <DimensionProgressMap
                          subdimensions={subdimensions}
                          onStartAssessment={() => setShowMap(false)}
                        />
                      ) : (
                        criteria[currentCriterionIndex] && (
                          <CriterionQuestion
                            criterion={criteria[currentCriterionIndex]}
                            currentIndex={currentCriterionIndex}
                            totalCriteria={criteria.length}
                            onResponse={handleResponse}
                            onNext={handleNext}
                            onPrevious={handlePrevious}
                            initialResponse={responses.get(criteria[currentCriterionIndex].id)}
                          />
                        )
                      )}
                    </>
                  )}
                </>
              )}

              {/* FASE COMPLETADA */}
              {phase === 'completed' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Diagnóstico TIER 1 Completado!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Has completado las 40 preguntas clave. Ahora procesaremos tus respuestas.
                  </p>
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Analizando tus respuestas...</p>
                </div>
              )}

            </div>
          </div>

        </div>
    </div>
  )
}