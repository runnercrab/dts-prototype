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

// Iconos para cada dimensión EN ESPAÑOL
const DIMENSION_ICONS: Record<string, string> = {
  'Cliente': '🛒',
  'Estrategia': '📈',
  'Tecnología': '🧮',
  'Operaciones': '⚙️',
  'Cultura': '👥',
  'Datos': '📊',
  // Fallbacks en inglés
  'Customer': '🛒',
  'Strategy': '📈',
  'Technology': '🧮',
  'Operations': '⚙️',
  'Culture': '👥',
  'Data': '📊'
}

// Orden de las dimensiones EN ESPAÑOL
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
    <div className="space-y-3">
      
      {/* Header compacto */}
      <div>
        <h2 className="text-sm font-bold text-gray-900">
          Progreso del Diagnóstico
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {totalProgress.completed}/{totalProgress.total} completadas ({totalProgress.percentage}%)
        </p>
      </div>

      {/* Barra de progreso global */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${totalProgress.percentage}%` }} 
        />
      </div>

      {/* ICONOS DE DIMENSIONES - Compactos en 2 filas de 3 */}
      <div className="grid grid-cols-3 gap-2">
        {DIMENSION_ORDER.map(dimName => {
          const subs = groupedByDimension[dimName] || []
          const completed = subs.filter(s => s.is_completed).length
          const hasCurrent = subs.some(s => s.is_current)
          
          return (
            <div key={dimName} className="text-center">
              <div 
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-lg mb-1"
                style={{ 
                  background: hasCurrent ? '#10b981' : completed > 0 ? '#3b82f6' : '#6b7280',
                  color: 'white'
                }}
              >
                {DIMENSION_ICONS[dimName] || '📋'}
              </div>
              <div className="text-[10px] font-semibold text-gray-700 leading-tight">{dimName}</div>
              <div className="text-[9px] text-gray-500">
                {completed}/{subs.length}
              </div>
            </div>
          )
        })}
      </div>

      {/* ACCORDION DE SUBDIMENSIONES - Solo mostrar dimensión activa */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {DIMENSION_ORDER.map(dimName => {
          const subs = groupedByDimension[dimName] || []
          const completed = subs.filter(s => s.is_completed).length
          const hasCurrent = subs.some(s => s.is_current)
          
          // Solo mostrar dimensión si tiene subdimensión activa O está completa
          if (!hasCurrent && completed === 0) return null

          return (
            <div key={dimName}>
              {/* Dimensión header - MÁS COMPACTO */}
              <div 
                className="px-2 py-1 rounded-t-lg font-semibold text-white text-xs flex items-center justify-between"
                style={{ background: '#334155' }}
              >
                <span>{DIMENSION_ICONS[dimName] || '📋'} {dimName}</span>
                <span className="text-[10px] opacity-80">{completed}/{subs.length}</span>
              </div>

              {/* Subdimensiones grid - MÁS COMPACTO */}
              {subs.length > 0 ? (
                <div className="grid grid-cols-2 gap-1 p-1 border border-gray-200 rounded-b-lg bg-gray-50">
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
                        className="px-2 py-1 rounded text-xs transition-all"
                        style={{ 
                          background: bgColor,
                          color: textColor,
                          border: sub.is_current ? '2px solid #059669' : 'none'
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold">{sub.code}</span>
                          {sub.is_current && <span className="text-sm">▶</span>}
                        </div>
                        <div className="mt-0.5 text-[9px] leading-tight line-clamp-2">
                          {sub.name}
                        </div>
                        <div className="mt-0.5 text-[9px] opacity-80">
                          {sub.completed_criteria}/{sub.total_criteria}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Leyenda - CON TEXTO CLARO */}
      <div className="grid grid-cols-3 gap-1 text-[9px] pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: '#fecaca' }} />
          <span className="text-gray-700">Completa</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: '#10b981' }} />
          <span className="text-gray-700">En curso</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: '#ef4444' }} />
          <span className="text-gray-700">Pendiente</span>
        </div>
      </div>

    </div>
  )
}
