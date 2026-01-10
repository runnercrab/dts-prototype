'use client'

interface TimelineRoadmapProps {
  initiatives: Array<{
    id: string
    code: string
    title: string
    dimension: string
    timeframe: '6months' | '1year' | '2years' | '3years+'
    importance: number
    gap: number
  }>
}

// Colores por dimensión
const dimensionColors: Record<string, string> = {
  'strategy': '#8b5cf6',
  'customer': '#3b82f6',
  'technology': '#10b981',
  'operations': '#f59e0b',
  'culture': '#ec4899',
  'data': '#06b6d4'
}

const dimensionLabels: Record<string, string> = {
  'strategy': 'Estrategia',
  'customer': 'Cliente',
  'technology': 'Tecnología',
  'operations': 'Operaciones',
  'culture': 'Cultura',
  'data': 'Datos'
}

export default function TimelineRoadmap({ initiatives }: TimelineRoadmapProps) {
  
  // Agrupar por timeframe con lógica TM Forum
  const groupByPhase = () => {
    const phases = {
      phase1: initiatives.filter(i => i.timeframe === '6months'), // 0-6 meses → 30 días
      phase2: initiatives.filter(i => i.timeframe === '1year'),   // 6-12 meses → 60 días
      phase3: initiatives.filter(i => i.timeframe === '2years' || i.timeframe === '3years+') // 12+ → 90 días
    }
    
    return phases
  }

  const phases = groupByPhase()
  
  // Top 5 por fase (ordenados por importancia * gap)
  const getTopInitiatives = (phaseInitiatives: typeof initiatives, count: number = 5) => {
    return phaseInitiatives
      .sort((a, b) => (b.importance * b.gap) - (a.importance * a.gap))
      .slice(0, count)
  }

  return (
    <div className="space-y-6">
      
      {/* Timeline horizontal */}
      <div className="relative">
        {/* Línea de tiempo */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200" />
        
        <div className="grid grid-cols-3 gap-6 relative">
          
          {/* Fase 1: 30 días */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10">
                30
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-600 whitespace-nowrap">
                días
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fase 1: Quick Wins</h3>
              <p className="text-sm text-gray-600 mb-4">{phases.phase1.length} iniciativas</p>
              
              <div className="bg-green-50 rounded-lg p-4 space-y-2 text-left border border-green-200">
                {getTopInitiatives(phases.phase1, 3).map(init => (
                  <div 
                    key={init.id}
                    className="bg-white p-2 rounded border-l-4 hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: dimensionColors[init.dimension] }}
                  >
                    <p className="text-xs font-bold text-gray-900">{init.code}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{init.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: dimensionColors[init.dimension] }}
                      >
                        {dimensionLabels[init.dimension]}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Gap: {init.gap}
                      </span>
                    </div>
                  </div>
                ))}
                {phases.phase1.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{phases.phase1.length - 3} más
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fase 2: 60 días */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10">
                60
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-600 whitespace-nowrap">
                días
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fase 2: Foundation</h3>
              <p className="text-sm text-gray-600 mb-4">{phases.phase2.length} iniciativas</p>
              
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-left border border-blue-200">
                {getTopInitiatives(phases.phase2, 3).map(init => (
                  <div 
                    key={init.id}
                    className="bg-white p-2 rounded border-l-4 hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: dimensionColors[init.dimension] }}
                  >
                    <p className="text-xs font-bold text-gray-900">{init.code}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{init.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: dimensionColors[init.dimension] }}
                      >
                        {dimensionLabels[init.dimension]}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Gap: {init.gap}
                      </span>
                    </div>
                  </div>
                ))}
                {phases.phase2.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{phases.phase2.length - 3} más
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fase 3: 90 días */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10">
                90
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-600 whitespace-nowrap">
                días
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fase 3: Transformación</h3>
              <p className="text-sm text-gray-600 mb-4">{phases.phase3.length} iniciativas</p>
              
              <div className="bg-purple-50 rounded-lg p-4 space-y-2 text-left border border-purple-200">
                {getTopInitiatives(phases.phase3, 3).map(init => (
                  <div 
                    key={init.id}
                    className="bg-white p-2 rounded border-l-4 hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: dimensionColors[init.dimension] }}
                  >
                    <p className="text-xs font-bold text-gray-900">{init.code}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{init.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: dimensionColors[init.dimension] }}
                      >
                        {dimensionLabels[init.dimension]}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Gap: {init.gap}
                      </span>
                    </div>
                  </div>
                ))}
                {phases.phase3.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{phases.phase3.length - 3} más
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Resumen por dimensión */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Distribución por Dimensión</h4>
        <div className="grid grid-cols-6 gap-3">
          {Object.entries(dimensionLabels).map(([key, label]) => {
            const count = initiatives.filter(i => i.dimension === key).length
            return (
              <div key={key} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2"
                  style={{ backgroundColor: dimensionColors[key] }}
                >
                  {count}
                </div>
                <p className="text-xs text-gray-700">{label}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
