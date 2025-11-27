'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AvatarPane from '@/components/AvatarPane'
import AssistantChat from '@/components/AssistantChat'
import OnboardingWorkshop from '@/components/diagnostico/OnboardingWorkshop'
import DimensionProgressMap from '@/components/diagnostico/DimensionProgressMapVisual'
import CriterionQuestion from '@/components/diagnostico/CriterionQuestion'
import bus from '@/lib/bus'

export const dynamic = 'force-dynamic'

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
    dimension_display_order?: number
    subdimension_display_order?: number
  }
  dimension?: {
    name: string
    code: string
    display_order?: number
  }
  level_1_description_es?: string
  level_2_description_es?: string
  level_3_description_es?: string
  level_4_description_es?: string
  level_5_description_es?: string
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  saved?: boolean
}

export default function DiagnosticoFullPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'onboarding' | 'assessment' | 'completed'>('onboarding')
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<any>(null)
  
  useEffect(() => {
    console.log('🆔 assessmentId cambió a:', assessmentId)
    if (assessmentId) {
      console.log('✅ Guardando en localStorage:', assessmentId)
      localStorage.setItem('dts_assessment_id', assessmentId)
    }
  }, [assessmentId])
  
  const [showMap, setShowMap] = useState(true)
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([])
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, Response>>(new Map())
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleChatMessage = async (message: { role: 'user' | 'assistant' | 'system'; content: string }) => {
      const newMessage = { ...message, saved: false }
      setCurrentChatMessages(prev => [...prev, newMessage])
      
      if (assessmentId && criteria[currentCriterionIndex]) {
        try {
          const currentCriterion = criteria[currentCriterionIndex]
          await supabase.from('dts_chat_messages').insert({
            assessment_id: assessmentId,
            criteria_id: currentCriterion.id,
            role: message.role,
            content: message.content
          })
          console.log('💾 Mensaje nuevo guardado en BD')
          
          setCurrentChatMessages(prev => 
            prev.map(msg => 
              msg.content === message.content && msg.role === message.role
                ? { ...msg, saved: true }
                : msg
            )
          )
        } catch (error) {
          console.error('❌ Error guardando mensaje:', error)
        }
      }
    }
    
    bus.on('chatMessage', handleChatMessage)
    return () => bus.off('chatMessage', handleChatMessage)
  }, [assessmentId, criteria, currentCriterionIndex])

  useEffect(() => {
    const loadMessagesForCriterion = async () => {
      console.log('🔍 useEffect disparado - currentCriterionIndex:', currentCriterionIndex)
      console.log('🔍 assessmentId:', assessmentId)
      console.log('🔍 criteria.length:', criteria.length)
      
      if (!assessmentId) {
        console.warn('⚠️ No hay assessmentId - limpiando chat')
        setCurrentChatMessages([])
        return
      }
      
      if (!criteria[currentCriterionIndex]) {
        console.warn('⚠️ No hay criterio en índice', currentCriterionIndex, '- limpiando chat')
        setCurrentChatMessages([])
        return
      }

      const currentCriterion = criteria[currentCriterionIndex]
      
      try {
        console.log(`📥 Cargando mensajes del criterio ${currentCriterion.code} (${currentCriterion.id})...`)
        
        const { data, error } = await supabase
          .from('dts_chat_messages')
          .select('role, content, created_at')
          .eq('assessment_id', assessmentId)
          .eq('criteria_id', currentCriterion.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ Error en query:', error)
          throw error
        }

        console.log('📊 Query resultado:', data?.length || 0, 'mensajes')

        if (data && data.length > 0) {
          const messages = data.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            saved: true
          }))
          console.log('📋 Mensajes que se van a cargar:', messages)
          setCurrentChatMessages(messages)
          console.log(`✅ ${messages.length} mensajes cargados para criterio ${currentCriterion.code}`)
        } else {
          setCurrentChatMessages([])
          console.log(`📝 Criterio ${currentCriterion.code} - chat limpio (nuevo o sin mensajes)`)
        }
      } catch (err) {
        console.error('❌ Error cargando mensajes:', err)
        setCurrentChatMessages([])
      }
    }

    loadMessagesForCriterion()
  }, [currentCriterionIndex, assessmentId, criteria])

  useEffect(() => {
    const checkExistingAssessment = async () => {
      try {
        const savedAssessmentId = localStorage.getItem('dts_assessment_id')
        if (savedAssessmentId) {
          const { data: assessment, error } = await supabase
            .from('dts_assessments')
            .select('id, status, onboarding_data')
            .eq('id', savedAssessmentId)
            .single()
          
          if (error || !assessment) {
            localStorage.removeItem('dts_assessment_id')
            return
          }
          
          setAssessmentId(savedAssessmentId)
          setOnboardingData(assessment.onboarding_data)
          await loadFullCriteria(savedAssessmentId)
          setPhase('assessment')
        }
      } catch (error) {
        console.error('Error recuperando assessment:', error)
      }
    }
    checkExistingAssessment()
  }, [])

  const loadFullCriteria = async (assessmentId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('dts_criteria')
        .select(`
          id, code, description, description_es, short_label, short_label_es,
          context, context_es, focus_area, tier, subdimension_id, display_order,
          level_1_description_es, level_2_description_es, level_3_description_es,
          level_4_description_es, level_5_description_es,
          dts_subdimensions!inner (
            id, code, name, name_es, display_order,
            dts_dimensions!inner (id, code, name, name_es, display_order)
          )
        `)
        .in('tier', ['tier1', 'tier2'])

      if (queryError) throw queryError
      if (!data || data.length === 0) throw new Error('No se encontraron criterios')

      const DIMENSION_NAME_MAP: Record<string, string> = {
        'Customer': 'Cliente', 'Strategy': 'Estrategia', 'Technology': 'Tecnología',
        'Operations': 'Operaciones', 'Culture': 'Cultura', 'Data': 'Datos'
      }

      const transformedCriteria: Criterion[] = data.map((c: any) => {
        const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions
        const dimension = subdimension?.dts_dimensions
        const dimensionArray = Array.isArray(dimension) ? dimension[0] : dimension
        const dimensionName = dimensionArray?.name || ''
        const dimensionNameEs = DIMENSION_NAME_MAP[dimensionName] || dimensionName

        return {
          id: c.id, code: c.code,
          description: c.description_es || c.description || '',
          short_label: c.short_label_es || c.short_label || '',
          context: c.context_es || c.context || null,
          focus_area: c.focus_area || '',
          subdimension_id: c.subdimension_id,
          subdimension: subdimension ? {
            name: subdimension.name_es || subdimension.name || '',
            code: subdimension.code || '',
            dimension_name: dimensionNameEs,
            dimension_display_order: dimensionArray?.display_order || 0,
            subdimension_display_order: subdimension.display_order || 0
          } : undefined,
          dimension: dimensionArray ? {
            name: dimensionNameEs,
            code: dimensionArray.code || '',
            display_order: dimensionArray.display_order || 0
          } : undefined,
          level_1_description_es: c.level_1_description_es,
          level_2_description_es: c.level_2_description_es,
          level_3_description_es: c.level_3_description_es,
          level_4_description_es: c.level_4_description_es,
          level_5_description_es: c.level_5_description_es
        }
      })

      const sortedCriteria = transformedCriteria.sort((a, b) => {
        const parseCode = (code: string) => code.split('.').map(part => parseInt(part) || 0)
        const partsA = parseCode(a.code)
        const partsB = parseCode(b.code)
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
          const numA = partsA[i] || 0
          const numB = partsB[i] || 0
          if (numA !== numB) return numA - numB
        }
        return 0
      })

      setCriteria(sortedCriteria)

      const { data: existingResponses } = await supabase
        .from('dts_responses')
        .select('*')
        .eq('assessment_id', assessmentId)

      if (existingResponses && existingResponses.length > 0) {
        const responsesMap = new Map<string, Response>()
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
        calculateSubdimensions(sortedCriteria, responsesMap)
      } else {
        calculateSubdimensions(sortedCriteria, new Map())
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateSubdimensions = (criteriaList: Criterion[], responsesMap: Map<string, any>) => {
    const subdimMap = new Map<string, Subdimension>()
    criteriaList.forEach(criterion => {
      if (!criterion.subdimension) return
      const key = criterion.subdimension.code
      if (!subdimMap.has(key)) {
        subdimMap.set(key, {
          id: criterion.subdimension_id,
          code: criterion.subdimension.code,
          name: criterion.subdimension.name,
          dimension_name: criterion.subdimension.dimension_name,
          total_criteria: 0, completed_criteria: 0,
          is_completed: false, is_current: false
        })
      }
      const subdim = subdimMap.get(key)!
      subdim.total_criteria++
      if (responsesMap.has(criterion.id)) subdim.completed_criteria++
    })
    const subdimArray = Array.from(subdimMap.values())
    subdimArray.forEach(subdim => {
      subdim.is_completed = subdim.completed_criteria === subdim.total_criteria
    })
    setSubdimensions(subdimArray)
  }

  const handleOnboardingComplete = async (newAssessmentId: string) => {
    console.log('🎯 handleOnboardingComplete llamado con ID:', newAssessmentId)
    setAssessmentId(newAssessmentId)
    console.log('💾 Guardando en localStorage:', newAssessmentId)
    localStorage.setItem('dts_assessment_id', newAssessmentId)
    
    const { data: assessment } = await supabase
      .from('dts_assessments')
      .select('onboarding_data')
      .eq('id', newAssessmentId)
      .single()
    
    if (assessment) {
      setOnboardingData(assessment.onboarding_data)
    }
    
    console.log('📚 Cargando criterios...')
    await loadFullCriteria(newAssessmentId)
    console.log('✅ Cambiando a fase assessment')
    setPhase('assessment')
  }

  const handleResponseChange = async (response: Response) => {
    if (!assessmentId || currentCriterionIndex >= criteria.length) {
      console.error('❌ No se puede guardar: assessmentId o criterio inválido')
      return
    }
    
    const criterion = criteria[currentCriterionIndex]
    
    if (!criterion || !criterion.id) {
      console.error('❌ No se puede guardar: criterion sin ID')
      return
    }
    
    try {
      console.log('💾 Guardando respuesta para criterio:', criterion.code)
      
      const { error } = await supabase.from('dts_responses').upsert({
        assessment_id: assessmentId,
        criteria_id: criterion.id,
        as_is_level: response.as_is_level,
        as_is_confidence: response.as_is_confidence,
        as_is_notes: response.as_is_notes || null,
        to_be_level: response.to_be_level,
        to_be_timeframe: response.to_be_timeframe,
        importance: response.importance,
        response_source: 'manual',
        reviewed_by_user: true
      }, { onConflict: 'assessment_id,criteria_id' })

      if (error) {
        console.error('❌ Error de Supabase:', error)
        throw error
      }

      const newResponses = new Map(responses)
      newResponses.set(criterion.id, response)
      setResponses(newResponses)
      calculateSubdimensions(criteria, newResponses)
      
      console.log('✅ Respuesta guardada exitosamente')
    } catch (err) {
      console.error('❌ Error guardando respuesta:', err)
      throw err
    }
  }

  const handleNext = () => {
    if (currentCriterionIndex < criteria.length - 1) {
      setCurrentCriterionIndex(currentCriterionIndex + 1)
    } else {
      handleAssessmentComplete()
    }
  }

  const handlePrevious = () => {
    if (currentCriterionIndex > 0) {
      setCurrentCriterionIndex(currentCriterionIndex - 1)
    }
  }

  const handleAssessmentComplete = async () => {
    if (!assessmentId) return
    
    try {
      await supabase.from('dts_assessments').update({
        status: 'full-completed',
        phase_2_completed: true,
        completed_at: new Date().toISOString()
      }).eq('id', assessmentId)
      
      setPhase('completed')
      localStorage.removeItem('dts_assessment_id')
    } catch (err) {
      console.error('Error completando assessment:', err)
    }
  }

  if (phase === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <OnboardingWorkshop 
            onComplete={handleOnboardingComplete}
            existingAssessmentId={assessmentId || undefined}
            existingData={onboardingData}
          />
        </div>
      </div>
    )
  }

  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 ¡Diagnóstico Completado!</h1>
          <p className="text-gray-600 mb-8">Tus respuestas han sido guardadas.</p>
          <button 
            onClick={() => router.push('/resultados')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver Resultados
          </button>
        </div>
      </div>
    )
  }

  const currentCriterion = criteria[currentCriterionIndex]
  const currentResponse = currentCriterion ? responses.get(currentCriterion.id) : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMap(!showMap)}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                {showMap ? '📊 Ocultar Mapa' : '📊 Mostrar Mapa'}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setPhase('onboarding')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Ver/Editar información del onboarding"
              >
                📋 Ver Onboarding
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => router.push('/resultados')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm"
                title="Ver resultados del diagnóstico"
              >
                📈 Ver Resultados
              </button>
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Diagnóstico de Madurez Digital
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                TM Forum DMM v5.0.1 - Versión Completa (129 criterios)
              </p>
            </div>
            <div className="w-[100px] lg:hidden"></div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          
          {/* SIDEBAR IZQUIERDO - Mapa de Progreso (2 columnas) */}
          {showMap && (
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-900 mb-2">Progreso</h3>
                <DimensionProgressMap 
                  subdimensions={subdimensions}
                  totalCriteria={criteria.length}
                  completedCriteria={responses.size}
                  onStartAssessment={() => {}}
                />
              </div>
            </div>
          )}

          {/* CONTENIDO CENTRAL - Pregunta (7 columnas con mapa, 9 sin mapa) */}
          <div className={`order-1 lg:order-2 ${showMap ? 'lg:col-span-7' : 'lg:col-span-9'}`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando diagnóstico...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            ) : currentCriterion ? (
              <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                <CriterionQuestion
                  criterion={currentCriterion}
                  currentIndex={currentCriterionIndex}
                  totalCriteria={criteria.length}
                  assessmentId={assessmentId!}
                  chatMessages={currentChatMessages}
                  initialResponse={currentResponse}
                  onResponse={handleResponseChange}
                  onNext={handleNext}
                  onPrevious={currentCriterionIndex > 0 ? handlePrevious : undefined}
                />
              </div>
            ) : null}
          </div>

          {/* SIDEBAR DERECHO - Avatar + Chat (3 columnas) */}
          {showMap && (
            <div className="lg:col-span-3 order-3">
              <div 
                className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4 flex flex-col"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                {/* Avatar compacto */}
                <div 
                  className="flex-shrink-0 bg-gray-50 border-b border-gray-200"
                  style={{ height: '350px' }}
                >
                  <AvatarPane />
                </div>
                {/* Chat expandido */}
                <div className="flex-1 min-h-0">
                  <AssistantChat messages={currentChatMessages} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
