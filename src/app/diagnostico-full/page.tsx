// src/app/diagnostico-full/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import AvatarPane from '@/components/AvatarPane'
import AssistantChat from '@/components/AssistantChat'
import OnboardingWorkshop from '@/components/diagnostico/OnboardingWorkshop'
import DimensionProgressMap from '@/components/diagnostico/DimensionProgressMapVisual'
import CriterionQuestion from '@/components/diagnostico/CriterionQuestion'
import bus from '@/lib/bus'
import { DEMO_FULL_ASSESSMENT_ID } from '@/lib/demo'

export const dynamic = 'force-dynamic'

// ✅ DEMO FULL: este assessment DEBE tener pack=tmf_full_v5 y onboarding_data ya relleno.

type CriterionCopy = {
  lang: 'es'
  pregunta: string
  niveles: Array<{ level: number; text: string }>
  source?: string
}

interface Criterion {
  id: string
  code: string

  // legacy
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

  // ✅ NEW (backend-driven)
  copy?: CriterionCopy | null
  response?: {
    as_is: number | null
    to_be: number | null
    importance: number | null
  } | null
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

// ✅ Normaliza response embebida (criterion.response) a ResponseT
function normalizeEmbeddedResponse(v: any): ResponseT | null {
  if (!v || typeof v !== 'object') return null

  const asIs = v.as_is ?? v.as_is_level ?? null
  const toBe = v.to_be ?? v.to_be_level ?? null
  const imp = v.importance ?? null

  return {
    as_is_level: asIs == null ? null : Number(asIs),
    to_be_level: toBe == null ? null : Number(toBe),
    importance: imp == null ? null : Number(imp),
    as_is_confidence: null,
    as_is_notes: null,
  }
}

// ✅ Si el backend no trae copy todavía, construimos copy desde legacy para no romper UI
function buildCopyFallbackFromLegacy(c: Criterion): CriterionCopy {
  const pregunta =
    c?.description || c?.short_label || `Criterio ${c.code || ''}`

  const niveles: Array<{ level: number; text: string }> = []
  const l1 = c.level_1_description_es
  const l2 = c.level_2_description_es
  const l3 = c.level_3_description_es
  const l4 = c.level_4_description_es
  const l5 = c.level_5_description_es

  if (l1) niveles.push({ level: 1, text: l1 })
  if (l2) niveles.push({ level: 2, text: l2 })
  if (l3) niveles.push({ level: 3, text: l3 })
  if (l4) niveles.push({ level: 4, text: l4 })
  if (l5) niveles.push({ level: 5, text: l5 })

  return { lang: 'es', pregunta, niveles, source: 'legacy_fields' }
}

// ============================================
// 🆕 SIDEBAR COMPONENT
// ============================================
interface SidebarProps {
  currentPhase: 'onboarding' | 'diagnostico' | 'resultados' | 'ejecucion'
  completedPhases?: string[]
  assessmentId?: string | null
  userName?: string
}

function Sidebar({ currentPhase, completedPhases = [], assessmentId, userName = 'Usuario' }: SidebarProps) {
  const PHASES = [
    { id: 'onboarding', label: 'Onboarding', href: '/diagnostico-full', step: 1 },
    { id: 'diagnostico', label: 'Diagnóstico', href: '/diagnostico-full', step: 2 },
    { id: 'resultados', label: 'Resultados', href: assessmentId ? `/resultados/${assessmentId}` : '#', step: 3 },
    { id: 'ejecucion', label: 'Ejecución', href: '#', step: 4 },
  ]

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const getPhaseState = (phaseId: string, step: number) => {
    const isCompleted = completedPhases.includes(phaseId)
    const isCurrent = currentPhase === phaseId
    
    if (completedPhases.length === 0) {
      const currentStep = PHASES.find(p => p.id === currentPhase)?.step || 1
      return {
        isCompleted: step < currentStep,
        isCurrent: step === currentStep,
        isDisabled: step > currentStep + 1
      }
    }

    return {
      isCompleted,
      isCurrent,
      isDisabled: !isCompleted && !isCurrent && step > 1
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center">
          <Image
            src="/gapply-logo.png"
            alt="Gapply"
            width={100}
            height={32}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Fases */}
      <div className="flex-1 p-4 pt-6">
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4 px-2">
          Fases
        </div>

        <nav className="space-y-1">
          {PHASES.map((phase) => {
            const { isCompleted, isCurrent, isDisabled } = getPhaseState(phase.id, phase.step)

            return (
              <Link
                key={phase.id}
                href={isDisabled ? '#' : phase.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                  ${isCurrent 
                    ? 'bg-green-100' 
                    : isCompleted
                      ? 'bg-green-50 hover:bg-green-100'
                      : isDisabled
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-slate-100'
                  }
                `}
                onClick={(e) => isDisabled && e.preventDefault()}
              >
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    phase.step
                  )}
                </div>

                <span className={`
                  font-medium text-[15px]
                  ${isCurrent 
                    ? 'text-green-700' 
                    : isCompleted 
                      ? 'text-slate-700'
                      : isDisabled
                        ? 'text-slate-400'
                        : 'text-slate-600'
                  }
                `}>
                  {phase.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Usuario */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">{userName}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============================================
// 🆕 FLOATING AVATAR BUTTON COMPONENT
// ============================================
function FloatingAvatarButton({ chatMessages }: { chatMessages: ChatMessage[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setHasInteracted(true)
  }

  return (
    <>
      {/* Overlay oscuro en móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel del Avatar */}
      <div className={`
        fixed z-50 transition-all duration-300 ease-out
        ${isOpen 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
        bottom-20 right-4 left-4
        sm:left-auto sm:right-6 sm:bottom-24 sm:w-[420px]
      `}>
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-800 to-blue-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Asistente Gapply</div>
                <div className="text-xs text-blue-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Disponible para ayudarte
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          {/* Avatar */}
          <div className="avatar-floating-container">
            <AvatarPane />
          </div>

          {/* Chat */}
          <div className="h-[200px] border-t border-slate-200">
            <AssistantChat messages={chatMessages} />
          </div>
        </div>
      </div>

      {/* Botón Flotante */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        className={`
          fixed bottom-6 right-6 z-50 
          w-16 h-16 rounded-full 
          flex items-center justify-center 
          transition-all duration-300 
          hover:scale-105 active:scale-95
          shadow-lg hover:shadow-xl
          ${isOpen 
            ? 'bg-slate-700 rotate-0' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
        `}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
      >
        {/* Indicador verde */}
        <span className={`
          absolute -top-0.5 -right-0.5 
          w-4 h-4 bg-green-500 rounded-full 
          border-2 border-white
          transition-all duration-300
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}>
          <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
        </span>
        
        {/* Icono que cambia */}
        <div className="relative w-7 h-7">
          {/* Icono Chat */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="white" 
            className={`absolute inset-0 w-7 h-7 transition-all duration-300 ${
              isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
          
          {/* Icono X */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="white" 
            className={`absolute inset-0 w-7 h-7 transition-all duration-300 ${
              isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>
      </button>

      {/* Tooltip de bienvenida - solo primera vez */}
      {!hasInteracted && !isOpen && (
        <div className="fixed bottom-24 right-6 z-40 animate-bounce-slow hidden sm:block">
          <div className="bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-slate-700 border border-slate-200">
            <div className="font-medium">👋 ¿Necesitas ayuda?</div>
            <div className="text-xs text-slate-500">Pulsa para hablar con el asistente</div>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .avatar-floating-container .card {
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: white !important;
        }
        
        .avatar-floating-container .card-body {
          padding: 12px !important;
        }
        
        .avatar-floating-container pre {
          display: none !important;
        }
        
        .avatar-floating-container .btn {
          font-size: 14px;
          padding: 8px 16px;
        }
        
        .avatar-floating-container .relative.w-full.h-\\[240px\\] {
          height: 240px !important;
        }

        /* 🆕 Check animation */
        .check-animation {
          animation: checkPop 0.6s ease-out forwards;
        }
        
        @keyframes checkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        .check-circle {
          stroke-dasharray: 63;
          stroke-dashoffset: 63;
          animation: drawCircle 0.4s ease-out forwards;
        }
        
        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .check-mark {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawCheck 0.3s ease-out 0.2s forwards;
        }
        
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function DiagnosticoFullPage() {
  const router = useRouter()

  // ✅ CAMBIO: default pack canónico a v2
  const DEFAULT_PACK = 'tmf_mvp12_v2'
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
  const [showCheckAnimation, setShowCheckAnimation] = useState(false)

  // ============================
  // Helpers (sin hooks)
  // ============================
  const currentCriterion = criteria[currentCriterionIndex]
  const currentResponse = currentCriterion ? responses.get(currentCriterion.id) : undefined

  const completedCount = Array.from(responses.entries()).filter(([_, r]) => isCompleteResponse(r)).length
  const pendingCount = criteria.filter((c) => !isCompleteResponse(responses.get(c.id))).length

  // ✅ CAMBIO: reconocer v2 también como MVP12
  const headerPackLabel =
    pack === 'tmf_mvp12_v1' ||
    pack === 'mvp12_v1' ||
    pack === 'tmf_mvp12_v2' ||
    pack === 'mvp12_v2'
      ? 'MVP12 (12 criterios)'
      : 'Versión Completa (129 criterios)'

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
        // ✅ y sincroniza LS al pack REAL del assessment (evita saltos a FULL)
        if (fromUrl) {
          await hydrateAssessment(fromUrl, { syncLocalStorage: true })
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
  const hydrateAssessment = async (id: string, opts?: { syncLocalStorage?: boolean }) => {
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
    const realPack: string | null = a?.pack ?? null

    setPack(realPack)
    setOnboardingData(a?.onboarding_data ?? null)

    // ✅ CLAVE: si venimos por URL, fijamos el assessmentId correcto en el LS del pack REAL
    if (opts?.syncLocalStorage && realPack) {
      const lsKey = `dts_assessment_id__${realPack}`
      localStorage.setItem(lsKey, String(id))
    }

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

      const listRaw: Criterion[] = cJson.criteria ?? []

      // ✅ NORMALIZA: garantiza criterion.copy (desde backend o fallback legacy)
      // ✅ NORMALIZA: hidrata responses map desde criterion.response (backend-driven)
      const map = new Map<string, ResponseT>()
      const list: Criterion[] = listRaw.map((c) => {
        const copy: CriterionCopy =
          c.copy && typeof c.copy?.pregunta === 'string'
            ? (c.copy as CriterionCopy)
            : buildCopyFallbackFromLegacy(c)

        const embedded = normalizeEmbeddedResponse(c.response)
        if (embedded) map.set(c.id, embedded)

        return {
          ...c,
          copy,
        }
      })

      setCriteria(list)
      setPack(cJson.pack ?? null)

      // ✅ IMPORTANTE: ya NO hacemos fetch a /api/dts/responses/get
      // El backend nos trae response embebida por criterio.
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
    // Mostrar animación de check
    setShowCheckAnimation(true)
    
    setTimeout(() => {
      setShowCheckAnimation(false)
      if (currentCriterionIndex < criteria.length - 1) {
        setCurrentCriterionIndex((i) => i + 1)
      } else {
        handleAssessmentComplete()
      }
    }, 600) // 600ms de animación
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
  // RENDERS - 🆕 CON SIDEBAR
  // ============================
  
  // 🆕 ONBOARDING con Sidebar
  if (phase === 'onboarding') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          currentPhase="onboarding" 
          completedPhases={[]} 
          assessmentId={assessmentId}
          userName="David A."
        />
        <div className="ml-64">
          <div className="container mx-auto px-4 py-8">
            <OnboardingWorkshop
              onComplete={handleOnboardingComplete}
              existingAssessmentId={assessmentId || undefined}
              existingData={onboardingData}
              pack={pack || DEFAULT_PACK}
            />
          </div>
        </div>
      </div>
    )
  }

  // 🆕 COMPLETED con Sidebar
  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          currentPhase="resultados" 
          completedPhases={['onboarding', 'diagnostico']} 
          assessmentId={assessmentId}
          userName="David A."
        />
        <div className="ml-64 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 ¡Diagnóstico Completado!</h1>
            <p className="text-gray-600 mb-8">Tus respuestas han sido guardadas.</p>
            <button onClick={goToResults} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Ver Resultados
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ Intro screen con Sidebar
  if (phase === 'assessment' && stage === 'diagnostico_intro') {
    const packLabel = pack || DEFAULT_PACK
    const criteriaLabel = totalCriteriaCount ? String(totalCriteriaCount) : '—'

    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          currentPhase="diagnostico" 
          completedPhases={['onboarding']} 
          assessmentId={assessmentId}
          userName="David A."
        />
        <div className="ml-64">
          {/* Top bar (simplified) */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Diagnóstico de Madurez Digital</h1>
                  <p className="text-xs sm:text-sm text-gray-600">TM Forum DMM v5.0.1 — {headerPackLabel}</p>
                </div>
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
                      <div className="mt-2 text-sm text-slate-600">Elige el nivel (1–5) que mejor describe tu realidad actual.</div>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500">2) TO-BE</div>
                      <div className="mt-1 font-semibold text-slate-900">Dónde quieres llegar</div>
                      <div className="mt-2 text-sm text-slate-600">
                        Elige el nivel objetivo (1–5). No es "lo ideal": es lo realista para tu negocio.
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

          {/* 🆕 Floating Avatar Button en intro también */}
          <FloatingAvatarButton chatMessages={currentChatMessages} />
        </div>
      </div>
    )
  }

  // ✅ Main assessment screen (questions) - CON SIDEBAR + 2 COLUMNAS + FLOATING BUTTON
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        currentPhase="diagnostico" 
        completedPhases={['onboarding']} 
        assessmentId={assessmentId}
        userName="David A."
      />
      <div className="ml-64">
        {/* Top bar - simplificado */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-900">Diagnóstico · {onboardingData?.companyName || 'Mi Empresa'}</h1>
              </div>
              
              <div className="text-sm text-gray-500">
                Pregunta {currentCriterionIndex + 1} de {criteria.length}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          {/* Grid layout */}
          <div className="grid grid-cols-12 gap-4">
            {/* Mapa de progreso */}
            {showMap && (
              <div className="col-span-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-2 max-h-[calc(100vh-100px)] overflow-y-auto">
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

            {/* Pregunta actual */}
            <div className={showMap ? 'col-span-8' : 'col-span-12'}>
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
                <div className="max-h-[calc(100vh-100px)] overflow-y-auto">
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
          </div>

          {/* Mini footer estado */}
          <div className="mt-2 text-xs text-gray-500">
            Completados: <span className="font-semibold">{completedCount}/{criteria.length}</span>
            <span className="mx-2">|</span>
            Pendientes: <span className="font-semibold">{pendingCount}</span>
          </div>
        </div>

        {/* 🆕 FLOATING AVATAR BUTTON */}
        <FloatingAvatarButton chatMessages={currentChatMessages} />

        {/* 🆕 CHECK ANIMATION cuando se completa un criterio */}
        {showCheckAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-white/50">
            <div className="check-animation bg-white rounded-full p-16 shadow-2xl">
              <svg 
                className="w-48 h-48 text-green-500" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <circle 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="1.2"
                  className="check-circle"
                />
                <path 
                  d="M7 13l3 3 7-7" 
                  stroke="currentColor" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="check-mark"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}