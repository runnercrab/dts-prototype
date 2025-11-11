'use client'

import { useMemo } from 'react'

// Colores por dimensión
const DIMENSION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Customer': { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  'Strategy': { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
  'Technology': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'Operations': { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  'Culture': { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6' },
  'Data': { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490' },
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

interface Props {
  subdimensions: Subdimension[]
  onSubdimensionClick: (subdimensionId: string) => void
}

export default function DimensionProgressMap({ subdimensions, onSubdimensionClick }: Props) {
  // Agrupar subdimensiones por dimensión
  const dimensionsMap = useMemo(() => {
    const map = new Map<string, Subdimension[]>()
    
    subdimensions.forEach(sub => {
      if (!map.has(sub.dimension_name)) {
        map.set(sub.dimension_name, [])
      }
      map.get(sub.dimension_name)!.push(sub)
    })
    
    return map
  }, [subdimensions])

  // Calcular progreso por dimensión
  const getDimensionProgress = (dimensionName: string): number => {
    const subs = dimensionsMap.get(dimensionName) || []
    const totalCriteria = subs.reduce((sum, sub) => sum + sub.total_criteria, 0)
    const completedCriteria = subs.reduce((sum, sub) => sum + sub.completed_criteria, 0)
    
    return totalCriteria > 0 ? (completedCriteria / totalCriteria) * 100 : 0
  }

  const getStatusIcon = (sub: Subdimension): string => {
    if (sub.is_completed) return '✓'
    if (sub.is_current) return '▶'
    return '○'
  }

  const getStatusColor = (sub: Subdimension): string => {
    if (sub.is_completed) return 'text-green-600'
    if (sub.is_current) return 'text-blue-600'
    return 'text-gray-400'
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Mapa de Progreso - Diagnóstico Digital
      </h2>

      <div className="space-y-6">
        {Array.from(dimensionsMap.entries()).map(([dimensionName, subs]) => {
          const colors = DIMENSION_COLORS[dimensionName] || DIMENSION_COLORS['Customer']
          const progress = getDimensionProgress(dimensionName)
          const isActive = subs.some(sub => sub.is_current)

          return (
            <div 
              key={dimensionName}
              className={`border-2 rounded-lg p-4 transition-all ${
                isActive 
                  ? `border-${colors.border} shadow-lg` 
                  : 'border-gray-200'
              }`}
              style={{
                backgroundColor: colors.bg,
                borderColor: isActive ? colors.border : undefined
              }}
            >
              {/* Header de Dimensión */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 
                    className="text-lg font-bold"
                    style={{ color: colors.text }}
                  >
                    {dimensionName}
                  </h3>
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {Math.round(progress)}%
                  </span>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: colors.border 
                    }}
                  />
                </div>
              </div>

              {/* Subdimensiones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => onSubdimensionClick(sub.id)}
                    className={`p-3 rounded-lg text-left transition-all border-2 ${
                      sub.is_current
                        ? 'bg-white shadow-md scale-105'
                        : sub.is_completed
                        ? 'bg-white bg-opacity-70 hover:bg-opacity-100'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                    }`}
                    style={{
                      borderColor: sub.is_current ? colors.border : 'transparent'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {sub.code}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {sub.name}
                        </div>
                      </div>
                      <div className={`text-xl ml-2 ${getStatusColor(sub)}`}>
                        {getStatusIcon(sub)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {sub.completed_criteria} / {sub.total_criteria}
                      </span>
                      <span className="font-medium" style={{ color: colors.text }}>
                        {sub.total_criteria > 0 
                          ? Math.round((sub.completed_criteria / sub.total_criteria) * 100)
                          : 0}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">Leyenda:</div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-lg">○</span>
            <span className="text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">▶</span>
            <span className="text-gray-600">En curso</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✓</span>
            <span className="text-gray-600">Completado</span>
          </div>
        </div>
      </div>
    </div>
  )
}