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
import { DEMO_FULL_ASSESSMENT_ID } from '@/lib/demo'

export const dynamic = 'force-dynamic'

// ✅ DEMO FULL: este assessment DEBE tener pack=tmf_full_v5 y onboarding_data ya relleno.

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
  as_is_level: number | null
  to_be_level: number | null
  importance: number | null
  as_is_confidence?: 'low' | 'medium' | 'high' | null
  as_is_notes?: string | null
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

function isCompleteResponse(r: ResponseT | undefined) {
  if (!r) return false
  return r.as_is_level != null && r.to_be_level != null && r.importance != null
}

function isAnyAnswered(r: ResponseT | undefined) {
  if (!r) return false
  return r.as_is_level != null || r.to_be_level != null || r.importance != null || !!r.as_is_notes
}

export default function DiagnosticoFullPage() {
  const router = useRouter()

  const DEFAULT_PACK = 'mvp12_v1'
  const createInFlightRef = useRef(false)

  const [phase, setPhase] = useState<'onboarding' | 'assessment' | 'completed'>('onboarding')

  // ✅ NEW: stage inside assessment flow
  const [stage, setStage] = useState<'diagnostico_intro' | 'diagnostico'>('diagnostico_intro')

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
  // Helpers (sin hooks)
  // ============================
  const currentCriterion = criteria[currentCriterionIndex]
  const currentResponse = currentCriterion ? responses.get(currentCriterion.id) : undefined

  const completedCount = Array.from(responses.entries()).filter(([_, r]) => isCompleteResponse(r)).length
  const pendingCount = criteria.filter((c) => !isCompleteResponse(responses.get(c.id))).length

  const headerPackLabel = pack === 'mvp12_v1' ? 'MVP12 (12 criterios)' : 'Versión Completa (129 criterios)'

  // ===== intro KPIs
  const totalCriteriaCount = criteria.length
  const progressLabel = `${completedCount}/${Math.max(1, totalCriteriaCount)}`

  // ✅ ÚNICO helper de navegación a resultados (evita errores / rutas legacy)
  const goToResults = () => {
    if (!assessmentId) return
    router.push(`/resultados/${assessmentId}`)
  }

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

        // ✅ Si viene assessmentId por URL, manda SIEMPRE
        if (fromUrl) {
          await hydrateAssessment(fromUrl)
          return
        }

        // ✅ DEMO FULL (si no viene id explícito)
        if (demoFromUrl) {
          await hydrateAssessment(DEMO_FULL_ASSESSMENT_ID)
          return
        }

        const lsKey = `dts_assessment_id__${packFromUrl}`
        const fromLs = localStorage.getItem(lsKey)

        if (fromLs) {
          await hydrateAssessment(fromLs)
          return
        }

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
      const cRes = await fetch(`/api/dts/criteria?assessmentId=${id}`, { cache: 'no-store' })
      const cJson = await safeReadJson(cRes)

      if (!cRes.ok || !cJson?.ok) {
        throw new Error(cJson?.error || `Error cargando criterios (${cRes.status})`)
      }

      const list: Criterion[] = cJson.criteria ?? []
      setCriteria(list)
      setPack(cJson.pack ?? null)

      const rRes = await fetch(`/api/dts/responses/get?assessmentId=${id}`, { cache: 'no-store' })
      const rJson = await safeReadJson(rRes)

      if (!rRes.ok || !rJson?.ok) {
        throw new Error(rJson?.error || `Error cargando respuestas (${rRes.status})`)
      }

      const map = new Map<string, ResponseT>()
      ;(rJson.responses ?? []).forEach((r: any) => {
        map.set(r.criteria_id, {
          as_is_level: r.as_is_level ?? null,
          to_be_level: r.to_be_level ?? null,
          importance: r.importance ?? null,
          as_is_confidence: r.as_is_confidence ?? null,
          as_is_notes: r.as_is_notes ?? null,
        })
      })

      setResponses(map)
      calculateSubdimensions(list, map)
      setCurrentCriterionIndex(0)

      // ✅ Decide intro vs ir directo a preguntas
      const hasAny = list.some((c) => isAnyAnswered(map.get(c.id)))
      setStage(hasAny ? 'diagnostico' : 'diagnostico_intro')
    } catch (err: any) {
      console.error('❌ loadCriteriaAndResponses error:', err)
      setError(err?.message || 'Error cargando diagnóstico')
    } finally {
      setLoading(false)
    }
  }

  const calculateSubdimensions = (criteriaList: Criterion[], responsesMap: Map<string, ResponseT>) => {
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

      const r = responsesMap.get(criterion.id)
      if (isCompleteResponse(r)) subdim.completed_criteria++
    })

    const subdimArray = Array.from(subdimMap.values())
    subdimArray.forEach((sd) => {
      sd.is_completed = sd.completed_criteria === sd.total_criteria
    })

    setSubdimensions(subdimArray)
  }

  // ============================
  // CHAT: save via API
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

      const res = await fetch(`/api/dts/chat/get?assessmentId=${assessmentId}&criteriaId=${criterion.id}`, {
        cache: 'no-store',
      })
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

  const handleGoToNextPending = () => {
    if (!criteria.length) return

    for (let step = 1; step <= criteria.length; step++) {
      const idx = (currentCriterionIndex + step) % criteria.length
      const c = criteria[idx]
      const r = responses.get(c.id)
      if (!isCompleteResponse(r)) {
        setCurrentCriterionIndex(idx)
        return
      }
    }
  }

  const handleGoToCriterion = (criterionId: string) => {
    const idx = criteria.findIndex((c) => c.id === criterionId)
    if (idx >= 0) setCurrentCriterionIndex(idx)
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

      if (!isDemo) {
        const key = `dts_assessment_id__${pack || DEFAULT_PACK}`
        localStorage.removeItem(key)
      }
    } catch (err) {
      console.error('❌ Error completando assessment:', err)
    }
  }

  // ============================
  // Intro Enter ↵ support
  // ============================
  useEffect(() => {
    if (phase !== 'assessment') return
    if (stage !== 'diagnostico_intro') return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setStage('diagnostico')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, stage])

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
            onClick={goToResults}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ver Resultados
          </button>
        </div>
      </div>
    )
  }

  // ✅ Intro screen
  if (phase === 'assessment' && stage === 'diagnostico_intro') {
    const packLabel = pack || DEFAULT_PACK
    const criteriaLabel = totalCriteriaCount ? String(totalCriteriaCount) : '—'

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar (simplified) */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="w-[100px]" />
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Diagnóstico de Madurez Digital</h1>
                <p className="text-xs sm:text-sm text-gray-600">TM Forum DMM v5.0.1 — {headerPackLabel}</p>
              </div>
              <div className="w-[100px]" />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
              <div className="text-sm text-slate-500 font-semibold">Paso 2</div>
              <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">2. Diagnóstico</h2>

              <p className="mt-4 text-lg text-slate-600">
                Ahora vamos a analizar tu transformación digital de forma <b>simple</b>, <b>práctica</b> y orientada a
                decisiones reales.
              </p>

              {/* Bloque 1 */}
              <div className="mt-8">
                <h3 className="text-base font-bold text-slate-900">Qué vas a hacer aquí</h3>
                <p className="mt-2 text-sm text-slate-600">
                  En cada criterio te pediremos <b>solo tres cosas</b>:
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">1) AS-IS</div>
                    <div className="mt-1 font-semibold text-slate-900">Cómo estás hoy</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Elige el nivel (1–5) que mejor describe tu realidad actual.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">2) TO-BE</div>
                    <div className="mt-1 font-semibold text-slate-900">Dónde quieres llegar</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Elige el nivel objetivo (1–5). No es “lo ideal”: es lo realista para tu negocio.
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">3) IMPORTANCIA</div>
                    <div className="mt-1 font-semibold text-slate-900">Para tu negocio, hoy</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Del 1 al 5: impacto en ventas, costes, eficiencia o experiencia de cliente.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2 */}
              <div className="mt-8">
                <h3 className="text-base font-bold text-slate-900">Cómo está organizado el diagnóstico</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Cubre <b>6 áreas clave del negocio</b>. Verás criterios de cada una:
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ['Estrategia', 'dirección, prioridades y foco real del negocio'],
                    ['Cliente', 'captación, relación y experiencia end-to-end'],
                    ['Tecnología', 'sistemas, automatización y ciberseguridad'],
                    ['Operaciones', 'procesos, ejecución y métricas'],
                    ['Cultura', 'personas, hábitos y adopción del cambio'],
                    ['Datos', 'calidad, gobierno y uso del dato para decidir'],
                  ].map(([t, d]) => (
                    <div key={t} className="rounded-2xl border p-4">
                      <div className="font-semibold text-slate-900">{t}</div>
                      <div className="mt-1 text-slate-600">{d}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 3 */}
              <div className="mt-8">
                <h3 className="text-base font-bold text-slate-900">Qué obtendrás al finalizar</h3>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    'Tus brechas clave (distancia entre AS-IS y TO-BE)',
                    'Tus frenos principales (qué bloquea hoy el negocio)',
                    'Una priorización clara (impacto vs esfuerzo)',
                    'Un plan por trimestres con seguimiento mensual',
                  ].map((x) => (
                    <div key={x} className="rounded-2xl border bg-slate-50 p-4 text-slate-700">
                      {x}
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Pack</div>
                  <div className="mt-1 font-mono text-sm text-slate-900">{packLabel}</div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Criterios</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900">{criteriaLabel}</div>
                </div>

                <div className="rounded-2xl border p-4">
                  <div className="text-xs text-slate-500">Progreso</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900">{progressLabel}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  onClick={() => setPhase('onboarding')}
                  className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold hover:bg-slate-50"
                >
                  ← Editar onboarding
                </button>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setStage('diagnostico')}
                    className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Diagnóstico →
                  </button>
                </div>
              </div>

              {/* Trust microcopy */}
              <div className="mt-6 text-sm text-slate-600">
                Tus respuestas se guardan automáticamente para que puedas continuar más tarde y ver el progreso.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Main assessment screen (questions)
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
                onClick={() => setPhase('onboarding')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Ver/Editar onboarding"
              >
                📋 Ver Onboarding
              </button>

              <span className="text-gray-300">|</span>

              {/* ✅ NEW: How it works */}
              <button
                onClick={() => setStage('diagnostico_intro')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                title="Cómo funciona el diagnóstico"
              >
                ❓ Cómo funciona
              </button>

              <span className="text-gray-300">|</span>

              <button
                onClick={goToResults}
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
                <DimensionProgressMap
                  criteria={criteria}
                  responses={responses}
                  currentCriterionId={currentCriterion?.id}
                  onGoToCriterion={handleGoToCriterion}
                  onGoToNextPending={handleGoToNextPending}
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

        {/* Mini footer estado */}
        <div className="mt-3 text-xs text-gray-500">
          Completados: <span className="font-semibold">{completedCount}/{criteria.length}</span>
          <span className="mx-2">|</span>
          Pendientes: <span className="font-semibold">{pendingCount}</span>
        </div>
      </div>
    </div>
  )
}
