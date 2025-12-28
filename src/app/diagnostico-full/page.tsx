// src/app/diagnostico-full/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import AvatarPane from '@/components/AvatarPane'
import AssistantChat from '@/components/AssistantChat'
import OnboardingWorkshop from '@/components/diagnostico/OnboardingWorkshop'
import DimensionProgressMap from '@/components/diagnostico/DimensionProgressMapVisual'
import CriterionQuestion from '@/components/diagnostico/CriterionQuestion'
import bus from '@/lib/bus'

export const dynamic = 'force-dynamic'

// ✅ DEMO FULL: este assessment DEBE tener pack=tmf_full_v5 y onboarding_data ya relleno.
// Si no lo tiene, te mandará a onboarding (correcto por seguridad).
const DEMO_FULL_ASSESSMENT_ID = 'b4b63b9b-4412-4628-8a9a-527b0696426a'

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

interface ResponseT {
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

async function safeReadJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export default function DiagnosticoFullPage() {
  const router = useRouter()

  const DEFAULT_PACK = 'mvp12_v1'
  const createInFlightRef = useRef(false)

  const [phase, setPhase] = useState<'onboarding' | 'assessment' | 'completed'>('onboarding')
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [pack, setPack] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const [showMap, setShowMap] = useState(true)
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([])
  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0)
  const [responses, setResponses] = useState<Map<string, ResponseT>>(new Map())
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================
  // INIT: crea/hidrata assessment por pack
  // ============================
  useEffect(() => {
    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search)

        const packFromUrl = params.get('pack') || DEFAULT_PACK
        const demoFromUrl = params.get('demo') === 'true'
        setPack(packFromUrl)
        setIsDemo(demoFromUrl)

        const fromUrl = params.get('assessmentId')

        // ✅ DEMO MODE (FULL):
        // Si viene demo=true y NO viene assessmentId, forzamos un assessment demo fijo (no crea nada).
        if (demoFromUrl && !fromUrl) {
          await hydrateAssessment(DEMO_FULL_ASSESSMENT_ID)
          return
        }

        const lsKey = `dts_assessment_id__${packFromUrl}`
        const fromLs = localStorage.getItem(lsKey)

        // 1) si viene explícito en URL
        if (fromUrl) {
          await hydrateAssessment(fromUrl)
          return
        }

        // 2) si hay en LS para este pack
        if (fromLs) {
          await hydrateAssessment(fromLs)
          return
        }

        // 3) si no hay id -> crear (solo para flujo normal, no demo)
        if (createInFlightRef.current) return
        createInFlightRef.current = true

        const res = await fetch('/api/dts/assessment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ pack: packFromUrl }),
        })

        const json = await safeReadJson(res)

        if (!res.ok || !json?.ok || !json?.assessmentId) {
          console.error('❌ assessment/create failed', { status: res.status, json })
          setPhase('onboarding')
          return
        }

        const newId = String(json.assessmentId)
        localStorage.setItem(lsKey, newId)

        await hydrateAssessment(newId)
      } catch (err) {
        console.error('❌ init diagnostico error:', err)
        setPhase('onboarding')
      } finally {
        createInFlightRef.current = false
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================
  // HYDRATE assessment
  // ============================
  const hydrateAssessment = async (id: string) => {
    setAssessmentId(id)

    const aRes = await fetch(`/api/dts/assessment/get?assessmentId=${id}`, { cache: 'no-store' })
    const aJson = await safeReadJson(aRes)

    if (!aRes.ok || !aJson?.ok) {
      console.error('❌ assessment/get failed', { status: aRes.status, aJson })
      setOnboardingData(null)
      setPhase('onboarding')
      return
    }

    const a = aJson.assessment
    setPack(a?.pack ?? null)
    setOnboardingData(a?.onboarding_data ?? null)

    if (!a?.onboarding_data) {
      setPhase('onboarding')
      return
    }

    await loadCriteriaAndResponses(id)
    setPhase('assessment')
  }

  // ============================
  // LOAD criteria + responses
  // ============================
  const loadCriteriaAndResponses = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      // criteria
      const cRes = await fetch(`/api/dts/criteria?assessmentId=${id}`, { cache: 'no-store' })
      const cJson = await safeReadJson(cRes)

      if (!cRes.ok || !cJson?.ok) {
        throw new Error(cJson?.error || `Error cargando criterios (${cRes.status})`)
      }

      const list: Criterion[] = cJson.criteria ?? []
      setCriteria(list)
      setPack(cJson.pack ?? null)

      // responses
      const rRes = await fetch(`/api/dts/responses/get?assessmentId=${id}`, { cache: 'no-store' })
      const rJson = await safeReadJson(rRes)

      if (!rRes.ok || !rJson?.ok) {
        throw new Error(rJson?.error || `Error cargando respuestas (${rRes.status})`)
      }

      const map = new Map<string, ResponseT>()
      ;(rJson.responses ?? []).forEach((r: any) => {
        map.set(r.criteria_id, {
          as_is_level: r.as_is_level,
          as_is_confidence: r.as_is_confidence,
          as_is_notes: r.as_is_notes,
          to_be_level: r.to_be_level,
          to_be_timeframe: r.to_be_timeframe,
          importance: r.importance,
        })
      })

      setResponses(map)
      calculateSubdimensions(list, map)
      setCurrentCriterionIndex(0)
    } catch (err: any) {
      console.error('❌ loadCriteriaAndResponses error:', err)
      setError(err?.message || 'Error cargando diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const calculateSubdimensions = (criteriaList: Criterion[], responsesMap: Map<string, any>) => {
    const subdimMap = new Map<string, Subdimension>()

    criteriaList.forEach((criterion) => {
      if (!criterion.subdimension) return
      const key = criterion.subdimension.code

      if (!subdimMap.has(key)) {
        subdimMap.set(key, {
          id: criterion.subdimension_id,
          code: criterion.subdimension.code,
          name: criterion.subdimension.name,
          dimension_name: criterion.subdimension.dimension_name,
          total_criteria: 0,
          completed_criteria: 0,
          is_completed: false,
          is_current: false,
        })
      }

      const subdim = subdimMap.get(key)!
      subdim.total_criteria++
      if (responsesMap.has(criterion.id)) subdim.completed_criteria++
    })

    const subdimArray = Array.from(subdimMap.values())
    subdimArray.forEach((sd) => {
      sd.is_completed = sd.completed_criteria === sd.total_criteria
    })

    setSubdimensions(subdimArray)
  }

  // ============================
  // CHAT: save via API (NO supabase)
  // ============================
  useEffect(() => {
    const handleChatMessage = async (message: { role: 'user' | 'assistant' | 'system'; content: string }) => {
      const newMessage = { ...message, saved: false }
      setCurrentChatMessages((prev) => [...prev, newMessage])

      if (!assessmentId) return
      const criterion = criteria[currentCriterionIndex]
      if (!criterion?.id) return

      try {
        const res = await fetch('/api/dts/chat/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            assessmentId,
            criteriaId: criterion.id,
            role: message.role,
            content: message.content,
          }),
        })

        const json = await safeReadJson(res)
        if (!res.ok || !json?.ok) throw new Error(json?.error || `chat/post ${res.status}`)

        setCurrentChatMessages((prev) =>
          prev.map((msg) =>
            msg.content === message.content && msg.role === message.role ? { ...msg, saved: true } : msg
          )
        )
      } catch (err) {
        console.error('❌ Error guardando chat por API:', err)
      }
    }

    bus.on('chatMessage', handleChatMessage)
    return () => bus.off('chatMessage', handleChatMessage)
  }, [assessmentId, criteria, currentCriterionIndex])

  // ============================
  // CHAT: load via API per criterion
  // ============================
  useEffect(() => {
    const load = async () => {
      if (!assessmentId) return
      const criterion = criteria[currentCriterionIndex]
      if (!criterion?.id) {
        setCurrentChatMessages([])
        return
      }

      const res = await fetch(
        `/api/dts/chat/get?assessmentId=${assessmentId}&criteriaId=${criterion.id}`,
        { cache: 'no-store' }
      )
      const json = await safeReadJson(res)

      if (!res.ok || !json?.ok) {
        console.error('❌ chat/get error', { status: res.status, json })
        setCurrentChatMessages([])
        return
      }

      setCurrentChatMessages(
        (json.messages ?? []).map((m: any) => ({
          role: m.role,
          content: m.content,
          saved: true,
        }))
      )
    }

    load()
  }, [assessmentId, criteria, currentCriterionIndex])

  // ============================
  // Onboarding complete
  // ============================
  const handleOnboardingComplete = async (id: string) => {
    await hydrateAssessment(id)
  }

  // ============================
  // Save response
  // ============================
  const handleResponseChange = async (response: ResponseT) => {
    if (!assessmentId) return
    if (currentCriterionIndex >= criteria.length) return

    const criterion = criteria[currentCriterionIndex]
    if (!criterion?.id) return

    const missing =
      response.as_is_level == null ||
      response.as_is_confidence == null ||
      response.to_be_level == null ||
      response.to_be_timeframe == null ||
      response.importance == null

    if (missing) return

    const res = await fetch('/api/dts/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        assessmentId,
        criteriaId: criterion.id,
        response,
      }),
    })

    const json = await safeReadJson(res)
    if (!res.ok || !json?.ok) {
      console.error('❌ /api/dts/responses error:', { httpStatus: res.status, json })
      throw new Error(json?.error || `API error ${res.status}`)
    }

    const newMap = new Map(responses)
    newMap.set(criterion.id, response)
    setResponses(newMap)
    calculateSubdimensions(criteria, newMap)
  }

  const handleNext = () => {
    if (currentCriterionIndex < criteria.length - 1) setCurrentCriterionIndex((i) => i + 1)
    else handleAssessmentComplete()
  }

  const handlePrevious = () => {
    if (currentCriterionIndex > 0) setCurrentCriterionIndex((i) => i - 1)
  }

  const handleAssessmentComplete = async () => {
    if (!assessmentId) return

    try {
      await fetch('/api/dts/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ assessmentId }),
      })

      setPhase('completed')

      // limpiamos SOLO el key del pack actual (en demo no tocamos LS)
      if (!isDemo) {
        const key = `dts_assessment_id__${pack || DEFAULT_PACK}`
        localStorage.removeItem(key)
      }
    } catch (err) {
      console.error('❌ Error completando assessment:', err)
    }
  }

  // ============================
  // RENDERS
  // ============================
  if (phase === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <OnboardingWorkshop
            onComplete={handleOnboardingComplete}
            existingAssessmentId={assessmentId || undefined}
            existingData={onboardingData}
            pack={pack || DEFAULT_PACK}
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
            onClick={() => router.push(`/resultados?assessmentId=${assessmentId ?? ''}`)}
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
  const headerPackLabel = pack === 'mvp12_v1' ? 'MVP12 (12 criterios)' : 'Versión Completa (129 criterios)'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
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
                onClick={() => {
                  // En demo, no tiene sentido “volver a onboarding” del ejemplo completo.
                  // No rompemos nada: simplemente lo dejamos como estaba si lo necesitas.
                  setPhase('onboarding')
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Ver/Editar onboarding"
              >
                📋 Ver Onboarding
              </button>

              <span className="text-gray-300">|</span>

              <button
                onClick={() => router.push(`/resultados?assessmentId=${assessmentId ?? ''}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm"
                title="Ver resultados"
              >
                📈 Ver Resultados
              </button>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Diagnóstico de Madurez Digital</h1>
              <p className="text-xs sm:text-sm text-gray-600">TM Forum DMM v5.0.1 — {headerPackLabel}</p>
            </div>

            <div className="w-[100px] lg:hidden"></div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          {showMap && (
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Mapa de Progreso</h3>
                <DimensionProgressMap
                  subdimensions={subdimensions}
                  totalCriteria={criteria.length}
                  completedCriteria={responses.size}
                  onStartAssessment={() => {}}
                />
              </div>
            </div>
          )}

          <div className={`order-1 lg:order-2 ${showMap ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
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

          {showMap && (
            <div className="lg:col-span-3 order-3">
              <div
                className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4 flex flex-col"
                style={{ height: 'calc(100vh - 120px)' }}
              >
                <div
                  className="flex-shrink-0 bg-gray-50 border-b border-gray-200 2xl:h-[380px]"
                  style={{ height: '300px' }}
                >
                  <AvatarPane />
                </div>
                <div className="flex-1 min-h-0 relative">
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
