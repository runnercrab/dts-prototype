// ============================================================================
// FILE: src/components/diagnostico/CriterionQuestion.tsx
// PURPOSE: UI pregunta — permite guardar nulls (parcial).
//          ✅ Cambio: NO bloquear navegación si está incompleto.
//          - Si está totalmente vacío: navega sin guardar.
//          - Si hay algo (parcial o completo): guarda (permitiendo nulls) y navega.
// ============================================================================

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'

interface Criterion {
  id: string
  code: string
  description: string
  short_label: string
  focus_area: string
  context?: string
  subdimension?: { name: string; code: string }
  dimension?: { name: string; code: string }
  level_1_description_es?: string
  level_2_description_es?: string
  level_3_description_es?: string
  level_4_description_es?: string
  level_5_description_es?: string
}

type Confidence = 'low' | 'medium' | 'high'
type Timeframe = '6months' | '1year' | '2years' | '3years+'

interface Response {
  as_is_level: number | null
  to_be_level: number | null
  importance: number | null
  as_is_confidence?: Confidence | null
  as_is_notes?: string | null
  to_be_timeframe?: Timeframe | null
}

interface CriterionQuestionProps {
  criterion: Criterion
  currentIndex: number
  totalCriteria: number
  assessmentId: string
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  onResponse: (response: Response) => Promise<void>
  onNext: () => void
  onPrevious?: () => void
  initialResponse?: Response
}

function safeLogSupabaseError(err: any) {
  try {
    const payload = {
      name: err?.name,
      message: err?.message,
      details: err?.details,
      hint: err?.hint,
      code: err?.code,
      status: err?.status,
      stack: err?.stack,
    }
    console.error('❌ Supabase/Postgrest error (expanded):', payload)
  } catch {
    console.error('❌ Error (raw):', err)
  }
}

function isComplete(r: Response) {
  return r.as_is_level != null && r.to_be_level != null && r.importance != null
}

function getLevelLabel(level: number) {
  const labels: Record<number, string> = {
    1: 'Inicial',
    2: 'Emergente',
    3: 'Definido',
    4: 'Gestionado',
    5: 'Optimizado',
  }
  return labels[level] || ''
}

function getLevelDescription(criterion: Criterion, level: number): string | null {
  const key = `level_${level}_description_es` as keyof Criterion
  return (criterion[key] as string) || null
}

function gapMeta(g: number) {
  if (g <= 0) return { bg: '#F8FAFC', text: '#334155', border: '#CBD5E1' }
  if (g === 1) return { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' }
  if (g === 2) return { bg: '#FFF7ED', text: '#9A3412', border: '#FB923C' }
  return { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444' }
}

export default function CriterionQuestion({
  criterion,
  currentIndex,
  totalCriteria,
  assessmentId,
  chatMessages = [],
  onResponse,
  onNext,
  onPrevious,
  initialResponse,
}: CriterionQuestionProps) {
  const [asIsLevel, setAsIsLevel] = useState<number | null>(initialResponse?.as_is_level ?? null)
  const [toBeLevel, setToBeLevel] = useState<number | null>(initialResponse?.to_be_level ?? null)
  const [importance, setImportance] = useState<number | null>(initialResponse?.importance ?? null)

  const [comments, setComments] = useState<string>(initialResponse?.as_is_notes ?? '')
  const asIsConfidence: Confidence | null = null
  const toBeTimeframe: Timeframe | null = null

  const [saving, setSaving] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const asIsSelectedRef = useRef<HTMLDivElement | null>(null)
  const toBeSelectedRef = useRef<HTMLDivElement | null>(null)

  const [connector, setConnector] = useState<{ show: boolean; x1: number; y1: number; x2: number; y2: number }>({
    show: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  })

  const hasLevelDescriptions = useMemo(() => {
    return !!(
      criterion.level_1_description_es ||
      criterion.level_2_description_es ||
      criterion.level_3_description_es ||
      criterion.level_4_description_es ||
      criterion.level_5_description_es
    )
  }, [criterion])

  const gap = useMemo(() => {
    if (asIsLevel == null || toBeLevel == null) return null
    return toBeLevel - asIsLevel
  }, [asIsLevel, toBeLevel])

  useEffect(() => {
    let ro: ResizeObserver | null = null

    function shouldShowConnector() {
      if (typeof window === 'undefined') return false
      if (window.innerWidth < 768) return false
      if (asIsLevel == null || toBeLevel == null) return false
      if (asIsLevel === toBeLevel) return false
      if (!containerRef.current || !asIsSelectedRef.current || !toBeSelectedRef.current) return false
      return true
    }

    function computeConnector() {
      const show = shouldShowConnector()
      if (!show) {
        setConnector((c) => (c.show ? { show: false, x1: 0, y1: 0, x2: 0, y2: 0 } : c))
        return
      }

      const container = containerRef.current!
      const leftEl = asIsSelectedRef.current!
      const rightEl = toBeSelectedRef.current!

      const cRect = container.getBoundingClientRect()
      const lRect = leftEl.getBoundingClientRect()
      const rRect = rightEl.getBoundingClientRect()

      const x1 = lRect.right - cRect.left
      const y1 = lRect.top - cRect.top + lRect.height / 2

      const x2 = rRect.left - cRect.left
      const y2 = rRect.top - cRect.top + rRect.height / 2

      setConnector({ show: true, x1, y1, x2, y2 })
    }

    computeConnector()

    function onResize() {
      computeConnector()
    }
    function onScroll() {
      computeConnector()
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => computeConnector())
      if (containerRef.current) ro.observe(containerRef.current)
      if (asIsSelectedRef.current) ro.observe(asIsSelectedRef.current)
      if (toBeSelectedRef.current) ro.observe(toBeSelectedRef.current)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
      if (ro) ro.disconnect()
    }
  }, [asIsLevel, toBeLevel, criterion.id])

  useEffect(() => {
    if (initialResponse) {
      setAsIsLevel(initialResponse?.as_is_level ?? null)
      setToBeLevel(initialResponse?.to_be_level ?? null)
      setImportance(initialResponse?.importance ?? null)
      setComments(initialResponse?.as_is_notes || '')
    } else {
      setAsIsLevel(null)
      setToBeLevel(null)
      setImportance(null)
      setComments('')
    }
  }, [criterion.id, initialResponse])

  const guardarTodo = async () => {
    if (!assessmentId) {
      alert('No hay assessmentId. No se puede guardar.')
      return false
    }

    setSaving(true)
    try {
      const payload: Response = {
        as_is_level: asIsLevel == null ? null : Number(asIsLevel),
        to_be_level: toBeLevel == null ? null : Number(toBeLevel),
        importance: importance == null ? null : Number(importance),
        as_is_confidence: asIsConfidence ?? null,
        as_is_notes: comments?.trim() ? comments.trim() : null,
        to_be_timeframe: toBeTimeframe ?? null,
      }

      await onResponse(payload)
      return true
    } catch (error: any) {
      console.error('❌ Error guardando respuesta (raw):', error)
      safeLogSupabaseError(error)
      const msg = error?.message || 'Error desconocido'
      alert(`Error al guardar. ${msg}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  // ✅ “Totalmente vacío” => no guardes, solo navega (política de parcialidad)
  const isTotallyEmpty = useMemo(() => {
    const noLevels = asIsLevel == null && toBeLevel == null && importance == null
    const noNotes = !comments?.trim()
    return noLevels && noNotes
  }, [asIsLevel, toBeLevel, importance, comments])

  // ✅ Navegación: no bloquea por incompleto
  const handleNext = async () => {
    if (saving) return
    if (isTotallyEmpty) {
      onNext()
      return
    }
    const ok = await guardarTodo()
    if (ok) onNext()
  }

  const handlePrevious = async () => {
    if (!onPrevious) return
    if (saving) return
    if (isTotallyEmpty) {
      onPrevious()
      return
    }
    const ok = await guardarTodo()
    if (ok) onPrevious()
  }

  // Paleta
  const ASIS_MAIN = '#2563EB'
  const ASIS_BORDER = 'border-[#2563EB]'
  const ASIS_BG = 'bg-[#EFF6FF]'

  const TOBE_MAIN = '#15803D'
  const TOBE_BORDER = 'border-[#15803D]'
  const TOBE_BG = 'bg-[#ECFDF5]'

  // ✅ Importancia seleccionada: borde fuerte + relleno suave (homogéneo)
  const IMPORT_SELECTED_BG = '#ECFDF5'
  const IMPORT_SELECTED_BORDER = '#15803D'
  const IMPORT_SELECTED_TEXT = '#14532D'

  const importanceLabel = (v: number) => {
    if (v === 1) return 'Muy baja'
    if (v === 2) return 'Baja'
    if (v === 3) return 'Media'
    if (v === 4) return 'Alta'
    return 'Crítica'
  }

  const completeNow = isComplete({
    as_is_level: asIsLevel,
    to_be_level: toBeLevel,
    importance,
    as_is_confidence: asIsConfidence,
    as_is_notes: comments,
    to_be_timeframe: toBeTimeframe,
  })

  const connectorPath = useMemo(() => {
    if (!connector.show) return ''
    const { x1, y1, x2, y2 } = connector
    const dx = Math.max(60, Math.min(240, Math.abs(x2 - x1) * 0.5))
    const c1x = x1 + dx
    const c1y = y1
    const c2x = x2 - dx
    const c2y = y2
    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`
  }, [connector])

  const levels: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header con progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">
            Pregunta {currentIndex + 1} de {totalCriteria}
            <span className="ml-2">
              {completeNow ? (
                <span className="text-green-700 font-medium">· Completo ✅</span>
              ) : (
                <span className="text-amber-700 font-medium">· Pendiente ⏳</span>
              )}
            </span>
          </div>
          <div className="text-sm font-medium" style={{ color: ASIS_MAIN }}>
            {criterion.dimension?.name} → {criterion.subdimension?.name}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalCriteria) * 100}%`, background: ASIS_MAIN }}
          />
        </div>
      </div>

      {/* Código y Título */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">{criterion.code}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{criterion.short_label}</h2>
        <p className="text-gray-600">{criterion.description}</p>
        {criterion.context && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-gray-700">
            <strong>Contexto:</strong> {criterion.context}
          </div>
        )}
      </div>

      {/* Selección AS-IS / TO-BE */}
      <div ref={containerRef} className="relative mb-6 p-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5" style={{ color: ASIS_MAIN }} />
          <h3 className="text-lg font-bold text-gray-900">Elige tu AS-IS y tu TO-BE</h3>
        </div>

        {connector.show && (
          <svg className="pointer-events-none absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L10,3 L0,6 Z" fill={TOBE_MAIN} />
              </marker>
            </defs>

            <circle cx={connector.x1} cy={connector.y1} r="6" fill={ASIS_MAIN} />
            <circle cx={connector.x2} cy={connector.y2} r="6" fill={TOBE_MAIN} />

            <path d={connectorPath} fill="none" stroke={TOBE_MAIN} strokeWidth="3" markerEnd="url(#arrowHead)" style={{ opacity: 0.95 }} />
          </svg>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AS-IS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold" style={{ color: ASIS_MAIN }}>
                Situación actual (AS-IS)
              </h4>
              <span className="text-xs px-3 py-1 rounded-full text-white font-semibold" style={{ background: ASIS_MAIN }}>
                AS-IS
              </span>
            </div>

            <div className="space-y-3">
              {levels.map((level) => {
                const description = hasLevelDescriptions ? getLevelDescription(criterion, level) : null
                const selected = asIsLevel === level
                const isDifferentPair = asIsLevel != null && toBeLevel != null && asIsLevel !== toBeLevel

                return (
                  <div
                    key={`as-is-${level}`}
                    ref={selected && isDifferentPair ? asIsSelectedRef : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={() => setAsIsLevel(level)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setAsIsLevel(level)
                    }}
                    className={[
                      'cursor-pointer p-4 rounded-xl border transition-all',
                      'hover:border-slate-300',
                      selected ? `border-2 ${ASIS_BORDER} ${ASIS_BG}` : 'border-slate-200 bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold"
                        style={{ background: selected ? ASIS_MAIN : '#DBEAFE', color: selected ? 'white' : ASIS_MAIN }}
                      >
                        {level}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-gray-900">{getLevelLabel(level)}</div>
                          {selected && (
                            <span className="text-xs px-2 py-1 rounded-full font-semibold text-white" style={{ background: ASIS_MAIN }}>
                              Seleccionado
                            </span>
                          )}
                        </div>
                        {description && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TO-BE */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold" style={{ color: TOBE_MAIN }}>
                Objetivo (TO-BE)
              </h4>
              <span className="text-xs px-3 py-1 rounded-full text-white font-semibold" style={{ background: TOBE_MAIN }}>
                TO-BE
              </span>
            </div>

            <div className="space-y-3">
              {levels.map((level) => {
                const description = hasLevelDescriptions ? getLevelDescription(criterion, level) : null
                const selected = toBeLevel === level
                const isDifferentPair = asIsLevel != null && toBeLevel != null && asIsLevel !== toBeLevel

                return (
                  <div
                    key={`to-be-${level}`}
                    ref={selected && isDifferentPair ? toBeSelectedRef : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={() => setToBeLevel(level)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setToBeLevel(level)
                    }}
                    className={[
                      'cursor-pointer p-4 rounded-xl border transition-all',
                      'hover:border-slate-300',
                      selected ? `border-2 ${TOBE_BORDER} ${TOBE_BG}` : 'border-slate-200 bg-white',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold"
                        style={{ background: selected ? TOBE_MAIN : '#DCFCE7', color: selected ? 'white' : TOBE_MAIN }}
                      >
                        {level}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-gray-900">{getLevelLabel(level)}</div>
                          {selected && (
                            <span className="text-xs px-2 py-1 rounded-full font-semibold text-white" style={{ background: TOBE_MAIN }}>
                              Seleccionado
                            </span>
                          )}
                        </div>
                        {description && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* GAP */}
        {gap != null && gap > 0 && (
          <div
            className="mt-6 p-4 rounded-xl border-2"
            style={{
              background: gapMeta(gap).bg,
              borderColor: gapMeta(gap).border,
            }}
          >
            <div className="font-bold" style={{ color: gapMeta(gap).text }}>
              Gap detectado: {gap} {gap === 1 ? 'nivel' : 'niveles'}
            </div>
          </div>
        )}
      </div>

      {/* Importancia */}
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Importancia para el negocio</h3>

        <div className="grid grid-cols-5 gap-3 max-w-xl">
          {[1, 2, 3, 4, 5].map((v) => {
            const selected = importance === v
            return (
              <button
                key={v}
                onClick={() => setImportance(v)}
                className={[
                  'h-12 rounded-xl border-2 font-bold transition-all',
                  selected ? '' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                ].join(' ')}
                style={
                  selected
                    ? {
                        background: IMPORT_SELECTED_BG,
                        borderColor: IMPORT_SELECTED_BORDER,
                        color: IMPORT_SELECTED_TEXT,
                      }
                    : undefined
                }
                title={importanceLabel(v)}
              >
                {v}
              </button>
            )
          })}
        </div>

        <div className="mt-3 text-sm text-gray-600">
          {importance == null ? 'Sin definir' : `Seleccionado: ${importance} (${importanceLabel(importance)})`}
        </div>
      </div>

      {/* Comentarios */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Comentarios</h3>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Añade contexto relevante (opcional)..."
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      </div>

      {/* ✅ Aviso se mantiene, pero NO bloquea */}
      {!completeNow && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
          Para continuar, selecciona <strong>AS-IS</strong>, <strong>TO-BE</strong> e <strong>Importancia</strong>.
          <span className="ml-2 opacity-80">(Puedes avanzar igualmente; se guardará cuando haya datos.)</span>
        </div>
      )}

      {/* Botones (✅ solo bloquea por saving) */}
      <div className="flex gap-4">
        {onPrevious && (
          <button
            onClick={handlePrevious}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                Guardando...
              </>
            ) : (
              '← Anterior'
            )}
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={saving}
          className="flex-1 px-6 py-3 text-white rounded-xl font-medium hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: ASIS_MAIN }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : currentIndex === totalCriteria - 1 ? (
            'Finalizar'
          ) : (
            'Siguiente →'
          )}
        </button>
      </div>

      {chatMessages.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          💬 {chatMessages.length} mensaje{chatMessages.length > 1 ? 's' : ''} del chat se ha
          {chatMessages.length > 1 ? 'n' : ''} guardado{chatMessages.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
