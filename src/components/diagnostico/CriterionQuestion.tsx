'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Criterion {
  id: string
  code: string
  description: string
  short_label: string
  focus_area: string
  context?: string
  subdimension?: {
    name: string
    code: string
  }
  dimension?: {
    name: string
    code: string
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
  // PostgrestError suele venir como objeto “vacío” al console.log, pero tiene campos útiles.
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
  const [asIsLevel, setAsIsLevel] = useState<number>(initialResponse?.as_is_level ?? 3)
  const [asIsConfidence, setAsIsConfidence] = useState<'low' | 'medium' | 'high'>(
    initialResponse?.as_is_confidence ?? 'medium'
  )
  const [asIsNotes, setAsIsNotes] = useState<string>(initialResponse?.as_is_notes ?? '')

  const [toBeLevel, setToBeLevel] = useState<number>(initialResponse?.to_be_level ?? 4)
  const [toBeTimeframe, setToBeTimeframe] = useState<'6months' | '1year' | '2years' | '3years+'>(
    initialResponse?.to_be_timeframe ?? '1year'
  )

  const [importance, setImportance] = useState<number>(initialResponse?.importance ?? 3)

  const [showLevelGuide, setShowLevelGuide] = useState(true)
  const [saving, setSaving] = useState(false)

  // Reset cuando cambia el criterio
  useEffect(() => {
    if (initialResponse) {
      setAsIsLevel(initialResponse.as_is_level)
      setAsIsConfidence(initialResponse.as_is_confidence)
      setAsIsNotes(initialResponse.as_is_notes || '')
      setToBeLevel(initialResponse.to_be_level)
      setToBeTimeframe(initialResponse.to_be_timeframe)
      setImportance(initialResponse.importance)
    } else {
      setAsIsLevel(3)
      setAsIsConfidence('medium')
      setAsIsNotes('')
      setToBeLevel(4)
      setToBeTimeframe('1year')
      setImportance(3)
    }
  }, [criterion.id, initialResponse])

  const gap = toBeLevel - asIsLevel

  // ========================================
  // FUNCIÓN ÚNICA QUE GUARDA TODO
  // ========================================
  const guardarTodo = async () => {
    if (!assessmentId) {
      alert('No hay assessmentId. No se puede guardar.')
      return false
    }

    setSaving(true)

    try {
      const response: Response = {
        as_is_level: Number(asIsLevel),
        as_is_confidence: asIsConfidence,
        as_is_notes: asIsNotes,
        to_be_level: Number(toBeLevel),
        to_be_timeframe: toBeTimeframe,
        importance: Number(importance),
      }

      await onResponse(response)
      console.log('✅ Respuesta guardada')
      return true
    } catch (error: any) {
      // Aquí está la “magia”: si supabase devuelve PostgrestError, en consola a veces sale {}
      console.error('❌ Error guardando respuesta (raw):', error)
      safeLogSupabaseError(error)

      // Mensaje útil al usuario (sin tecnicismos, pero con pista)
      const msg = error?.message || 'Error desconocido'
      alert(`Error al guardar. ${msg}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndNext = async () => {
    const success = await guardarTodo()
    if (success) onNext()
  }

  const handleSaveAndPrevious = async () => {
    if (!onPrevious) return
    const success = await guardarTodo()
    if (success) onPrevious()
  }

  const getLevelLabel = (level: number): string => {
    const labels = {
      1: 'Inicial',
      2: 'Emergente',
      3: 'Definido',
      4: 'Gestionado',
      5: 'Optimizado',
    }
    return labels[level as keyof typeof labels] || ''
  }

  const getGapColor = (g: number): string => {
    if (g <= 0) return 'text-gray-500'
    if (g === 1) return 'text-green-600'
    if (g === 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGapBg = (g: number): string => {
    if (g <= 0) return 'bg-gray-100'
    if (g === 1) return 'bg-green-50'
    if (g === 2) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getLevelDescription = (level: number): string | null => {
    const key = `level_${level}_description_es` as keyof Criterion
    return (criterion[key] as string) || null
  }

  const hasLevelDescriptions = !!(
    criterion.level_1_description_es ||
    criterion.level_2_description_es ||
    criterion.level_3_description_es ||
    criterion.level_4_description_es ||
    criterion.level_5_description_es
  )

  const LEVEL_COLORS = {
    1: 'border-red-200 bg-red-50',
    2: 'border-orange-200 bg-orange-50',
    3: 'border-yellow-200 bg-yellow-50',
    4: 'border-blue-200 bg-blue-50',
    5: 'border-green-200 bg-green-50',
  }

  const LEVEL_BADGE_COLORS = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-green-100 text-green-800',
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header con progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">
            Pregunta {currentIndex + 1} de {totalCriteria}
          </div>
          <div className="text-sm font-medium text-blue-600">
            {criterion.dimension?.name} → {criterion.subdimension?.name}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalCriteria) * 100}%` }}
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

      {/* Guía de Niveles */}
      {hasLevelDescriptions && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowLevelGuide(!showLevelGuide)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Guía de Niveles de Madurez
            </h3>
            {showLevelGuide ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showLevelGuide && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Lee estas descripciones para evaluar con precisión en qué nivel se encuentra tu organización:
              </p>

              {[1, 2, 3, 4, 5].map(level => {
                const description = getLevelDescription(level)
                if (!description) return null

                const isCurrentAsIs = asIsLevel === level
                const isCurrentToBe = toBeLevel === level

                return (
                  <div
                    key={level}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentAsIs || isCurrentToBe
                        ? `ring-2 ring-offset-2 ${isCurrentAsIs ? 'ring-blue-500' : 'ring-green-500'} ${
                            LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]
                          }`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                            LEVEL_BADGE_COLORS[level as keyof typeof LEVEL_BADGE_COLORS]
                          }`}
                        >
                          {level}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            Nivel {level} - {getLevelLabel(level)}
                          </h4>
                          {isCurrentAsIs && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              Tu nivel actual
                            </span>
                          )}
                          {isCurrentToBe && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                              Tu objetivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Gap */}
      {gap > 0 && (
        <div className={`mb-6 p-4 rounded-lg ${getGapBg(gap)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Gap Identificado</div>
              <div className={`text-2xl font-bold ${getGapColor(gap)}`}>
                {gap} {gap === 1 ? 'nivel' : 'niveles'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {getLevelLabel(asIsLevel)} → {getLevelLabel(toBeLevel)}
              </div>
              <div className="text-sm text-gray-500">
                Plazo:{' '}
                {toBeTimeframe === '6months'
                  ? '6 meses'
                  : toBeTimeframe === '1year'
                  ? '1 año'
                  : toBeTimeframe === '2years'
                  ? '2 años'
                  : '3+ años'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AS-IS */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Situación Actual (AS-IS)</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿En qué nivel te encuentras actualmente?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={asIsLevel}
            onChange={e => setAsIsLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
              Nivel {asIsLevel}: {getLevelLabel(asIsLevel)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas adicionales (opcional)</label>
          <textarea
            value={asIsNotes}
            onChange={e => setAsIsNotes(e.target.value)}
            placeholder="Añade cualquier contexto relevante..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      {/* TO-BE */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Objetivo (TO-BE)</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">¿A qué nivel quieres llegar?</label>
          <input
            type="range"
            min="1"
            max="5"
            value={toBeLevel}
            onChange={e => setToBeLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              Nivel {toBeLevel}: {getLevelLabel(toBeLevel)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">¿En cuánto tiempo planeas alcanzarlo?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { value: '6months', label: '6 meses' },
              { value: '1year', label: '1 año' },
              { value: '2years', label: '2 años' },
              { value: '3years+', label: '3+ años' },
            ] as const).map(option => (
              <button
                key={option.value}
                onClick={() => setToBeTimeframe(option.value)}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  toBeTimeframe === option.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* IMPORTANCE */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ Importancia para tu Negocio</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué tan importante es este aspecto para tu organización?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={importance}
            onChange={e => setImportance(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              Importancia:{' '}
              {importance === 1 ? 'Muy Baja' : importance === 2 ? 'Baja' : importance === 3 ? 'Media' : importance === 4 ? 'Alta' : 'Crítica'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        {onPrevious && (
          <button
            onClick={handleSaveAndPrevious}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          onClick={handleSaveAndNext}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Indicador de mensajes */}
      {chatMessages.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          💬 {chatMessages.length} mensaje{chatMessages.length > 1 ? 's' : ''} del chat se ha{chatMessages.length > 1 ? 'n' : ''} guardado
          {chatMessages.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
