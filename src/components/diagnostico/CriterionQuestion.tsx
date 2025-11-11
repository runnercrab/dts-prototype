'use client'

import { useState, useEffect } from 'react'

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
  onResponse: (response: Response) => void
  onNext: () => void
  onPrevious: () => void
  initialResponse?: Response
}

export default function CriterionQuestion({
  criterion,
  currentIndex,
  totalCriteria,
  onResponse,
  onNext,
  onPrevious,
  initialResponse
}: CriterionQuestionProps) {
  const [asIsLevel, setAsIsLevel] = useState<number>(initialResponse?.as_is_level || 3)
  const [asIsConfidence, setAsIsConfidence] = useState<'low' | 'medium' | 'high'>(
    initialResponse?.as_is_confidence || 'medium'
  )
  const [asIsNotes, setAsIsNotes] = useState<string>(initialResponse?.as_is_notes || '')
  
  const [toBeLevel, setToBeLevel] = useState<number>(initialResponse?.to_be_level || 4)
  const [toBeTimeframe, setToBeTimeframe] = useState<'6months' | '1year' | '2years' | '3years+'>(
    initialResponse?.to_be_timeframe || '1year'
  )
  
  const [importance, setImportance] = useState<number>(initialResponse?.importance || 3)

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

  const handleSaveAndNext = () => {
    const response: Response = {
      as_is_level: asIsLevel,
      as_is_confidence: asIsConfidence,
      as_is_notes: asIsNotes,
      to_be_level: toBeLevel,
      to_be_timeframe: toBeTimeframe,
      importance: importance
    }
    onResponse(response)
    onNext()
  }

  const handleSaveAndPrevious = () => {
    const response: Response = {
      as_is_level: asIsLevel,
      as_is_confidence: asIsConfidence,
      as_is_notes: asIsNotes,
      to_be_level: toBeLevel,
      to_be_timeframe: toBeTimeframe,
      importance: importance
    }
    onResponse(response)
    onPrevious()
  }

  const getLevelLabel = (level: number): string => {
    const labels = {
      1: 'Inicial',
      2: 'Emergente', 
      3: 'Definido',
      4: 'Gestionado',
      5: 'Optimizado'
    }
    return labels[level as keyof typeof labels] || ''
  }

  const getGapColor = (gap: number): string => {
    if (gap <= 0) return 'text-gray-500'
    if (gap === 1) return 'text-green-600'
    if (gap === 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGapBg = (gap: number): string => {
    if (gap <= 0) return 'bg-gray-100'
    if (gap === 1) return 'bg-green-50'
    if (gap === 2) return 'bg-yellow-50'
    return 'bg-red-50'
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {criterion.short_label}
        </h2>
        <p className="text-gray-600">{criterion.description}</p>
        {criterion.context && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-gray-700">
            <strong>Contexto:</strong> {criterion.context}
          </div>
        )}
      </div>

      {/* Gap Analysis Summary */}
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
                Plazo: {toBeTimeframe === '6months' ? '6 meses' : 
                       toBeTimeframe === '1year' ? '1 año' :
                       toBeTimeframe === '2years' ? '2 años' : '3+ años'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AS-IS: Situación Actual */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Situación Actual (AS-IS)
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿En qué nivel te encuentras actualmente?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={asIsLevel}
            onChange={(e) => setAsIsLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
              Nivel {asIsLevel}: {getLevelLabel(asIsLevel)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué tan seguro estás de esta evaluación?
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setAsIsConfidence(level)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  asIsConfidence === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level === 'low' ? 'Baja' : level === 'medium' ? 'Media' : 'Alta'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={asIsNotes}
            onChange={(e) => setAsIsNotes(e.target.value)}
            placeholder="Añade cualquier contexto relevante..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      {/* TO-BE: Objetivo */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Objetivo (TO-BE)
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿A qué nivel quieres llegar?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={toBeLevel}
            onChange={(e) => setToBeLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              Nivel {toBeLevel}: {getLevelLabel(toBeLevel)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿En cuánto tiempo planeas alcanzarlo?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { value: '6months', label: '6 meses' },
              { value: '1year', label: '1 año' },
              { value: '2years', label: '2 años' },
              { value: '3years+', label: '3+ años' }
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => setToBeTimeframe(option.value)}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  toBeTimeframe === option.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* IMPORTANCE: Importancia */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⭐ Importancia para tu Negocio
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Qué tan importante es este aspecto para tu organización?
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={importance}
            onChange={(e) => setImportance(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <div className="mt-2 text-center">
            <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              Importancia: {importance === 1 ? 'Muy Baja' : 
                           importance === 2 ? 'Baja' :
                           importance === 3 ? 'Media' :
                           importance === 4 ? 'Alta' : 'Crítica'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-4">
        <button
          onClick={handleSaveAndPrevious}
          disabled={currentIndex === 0}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        <button
          onClick={handleSaveAndNext}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          {currentIndex === totalCriteria - 1 ? 'Finalizar' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}