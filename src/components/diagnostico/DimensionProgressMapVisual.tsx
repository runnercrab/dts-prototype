'use client'

import { useMemo } from 'react'

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

interface Props {
  subdimensions: Subdimension[]
  onStartAssessment: () => void
  onSubdimensionClick?: (subdimensionId: string) => void
}

// 🌟 ACTUALIZADO: Iconos para cada dimensión EN ESPAÑOL
const DIMENSION_ICONS: Record<string, string> = {
  'Cliente': '🛒',
  'Estrategia': '📈',
  'Tecnología': '🧮',
  'Operaciones': '⚙️',
  'Cultura': '👥',
  'Datos': '📊',
  // Fallbacks en inglés por si acaso
  'Customer': '🛒',
  'Strategy': '📈',
  'Technology': '🧮',
  'Operations': '⚙️',
  'Culture': '👥',
  'Data': '📊'
}

// 🌟 ACTUALIZADO: Orden de las dimensiones EN ESPAÑOL
const DIMENSION_ORDER = ['Cliente', 'Estrategia', 'Tecnología', 'Operaciones', 'Cultura', 'Datos']

export default function DimensionProgressMapVisual({ subdimensions, onStartAssessment }: Props) {
  
  // Agrupar subdimensiones por dimensión
  const groupedByDimension = useMemo(() => {
    const groups: Record<string, Subdimension[]> = {}
    
    subdimensions.forEach(sub => {
      if (!groups[sub.dimension_name]) {
        groups[sub.dimension_name] = []
      }
      groups[sub.dimension_name].push(sub)
    })
    
    // Ordenar subdimensiones dentro de cada dimensión por código
    Object.keys(groups).forEach(dim => {
      groups[dim].sort((a, b) => a.code.localeCompare(b.code))
    })
    
    return groups
  }, [subdimensions])

  // Calcular progreso total
  const totalProgress = useMemo(() => {
    const completed = subdimensions.filter(s => s.is_completed).length
    const total = subdimensions.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }, [subdimensions])

  // Encontrar subdimensión actual
  const currentSub = subdimensions.find(s => s.is_current)

  return (
    <div className="space-y-6">
      
      {/* Header con progreso total */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Mapa de Progreso - Diagnóstico Digital
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalProgress.completed} de {totalProgress.total} subdimensiones completadas ({totalProgress.percentage}%)
          </p>
        </div>
        
        {currentSub && (
          <button
            onClick={onStartAssessment}
            className="btn btn-primary"
          >
            👉 Ver Pregunta
          </button>
        )}
      </div>

      {/* Barra de progreso global */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${totalProgress.percentage}%` }} 
        />
      </div>

      {/* ICONOS DE DIMENSIONES */}
      <div className="grid grid-cols-6 gap-4">
        {DIMENSION_ORDER.map(dimName => {
          const subs = groupedByDimension[dimName] || []
          const completed = subs.filter(s => s.is_completed).length
          const hasCurrent = subs.some(s => s.is_current)
          
          return (
            <div key={dimName} className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-2"
                style={{ 
                  background: hasCurrent ? '#10b981' : completed > 0 ? '#3b82f6' : '#6b7280',
                  color: 'white'
                }}
              >
                {DIMENSION_ICONS[dimName] || '📋'}
              </div>
              <div className="text-xs font-semibold text-gray-700">{dimName}</div>
              <div className="text-xs text-gray-500">
                {completed}/{subs.length}
              </div>
            </div>
          )
        })}
      </div>

      {/* GRID DE SUBDIMENSIONES */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {DIMENSION_ORDER.map(dimName => {
          const subs = groupedByDimension[dimName] || []
          const completed = subs.filter(s => s.is_completed).length

          return (
            <div key={dimName}>
              {/* Dimensión header */}
              <div 
                className="px-4 py-2 rounded-t-lg font-semibold text-white text-sm flex items-center justify-between"
                style={{ background: '#334155' }}
              >
                <span>{DIMENSION_ICONS[dimName] || '📋'} {dimName}</span>
                <span className="text-xs opacity-80">{completed}/{subs.length}</span>
              </div>

              {/* Subdimensiones grid o mensaje vacío */}
              {subs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 border border-gray-200 rounded-b-lg bg-gray-50">
                  {subs.map(sub => {
                    // Determinar color
                    let bgColor = '#ef4444' // Rojo - pendiente
                    let textColor = 'white'
                    
                    if (sub.is_current) {
                      bgColor = '#10b981' // Verde - en curso
                      textColor = 'white'
                    } else if (sub.is_completed) {
                      bgColor = '#fecaca' // Rosa claro - completada
                      textColor = '#7f1d1d'
                    }

                    return (
                      <div
                        key={sub.id}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ 
                          background: bgColor,
                          color: textColor,
                          border: sub.is_current ? '3px solid #059669' : 'none',
                          boxShadow: sub.is_current ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{sub.code}</span>
                          {sub.is_current && <span className="text-lg">▶</span>}
                        </div>
                        <div className="mt-1 text-xs leading-tight">
                          {sub.name}
                        </div>
                        <div className="mt-1 text-xs opacity-80">
                          {sub.completed_criteria}/{sub.total_criteria}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 border border-gray-200 rounded-b-lg bg-gray-50 text-center text-sm text-gray-500 italic">
                  Sin subdimensiones cargadas aún
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#fecaca' }} />
          <span className="text-gray-700">Completada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#10b981' }} />
          <span className="text-gray-700">En curso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: '#ef4444' }} />
          <span className="text-gray-700">Pendiente</span>
        </div>
      </div>

    </div>
  )
}