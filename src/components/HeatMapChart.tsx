'use client'

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Rectangle } from 'recharts'

interface HeatMapChartProps {
  criteria: Array<{
    id: string
    code: string
    title: string
    dimension: string
    importance: number      // 1-5 (eje Y)
    effort: number          // 1-5 (eje X)
    gap: number
    category: 'quick-win' | 'foundation' | 'transformational' | 'maintenance'
  }>
}

// Colores por dimensión (TM Forum)
const dimensionColors: Record<string, string> = {
  'strategy': '#8b5cf6',     // Púrpura
  'customer': '#3b82f6',     // Azul
  'technology': '#10b981',   // Verde
  'operations': '#f59e0b',   // Ámbar
  'culture': '#ec4899',      // Rosa
  'data': '#06b6d4'          // Cian
}

// Colores por categoría
const categoryColors: Record<string, string> = {
  'quick-win': '#10b981',         // Verde
  'foundation': '#3b82f6',        // Azul
  'transformational': '#f59e0b',  // Ámbar
  'maintenance': '#6b7280'        // Gris
}

// Labels para tooltip
const dimensionLabels: Record<string, string> = {
  'strategy': 'Estrategia',
  'customer': 'Cliente',
  'technology': 'Tecnología',
  'operations': 'Operaciones',
  'culture': 'Cultura',
  'data': 'Datos'
}

export default function HeatMapChart({ criteria }: HeatMapChartProps) {
  
  // Transformar datos para Recharts
  const data = criteria.map(c => ({
    x: c.effort,
    y: c.importance,
    z: c.gap * 5, // Tamaño del punto basado en gap
    code: c.code,
    title: c.title,
    dimension: c.dimension,
    category: c.category,
    gap: c.gap
  }))

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null
    
    const data = payload[0].payload
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
        <p className="font-bold text-gray-900">{data.code}</p>
        <p className="text-gray-700 mt-1 max-w-xs">{data.title}</p>
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          <p className="text-gray-600">
            <span className="font-semibold">Dimensión:</span> {dimensionLabels[data.dimension] || data.dimension}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Importancia:</span> {data.y}/5
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Esfuerzo:</span> {data.x}/5
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Gap:</span> {data.gap} niveles
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={600}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          
          {/* Cuadrantes de fondo */}
          <Rectangle 
            x={0} y={0} 
            width="50%" height="50%" 
            fill="#fef3c7" fillOpacity={0.2}
          />
          <Rectangle 
            x="50%" y={0} 
            width="50%" height="50%" 
            fill="#dbeafe" fillOpacity={0.2}
          />
          <Rectangle 
            x={0} y="50%" 
            width="50%" height="50%" 
            fill="#d1fae5" fillOpacity={0.2}
          />
          <Rectangle 
            x="50%" y="50%" 
            width="50%" height="50%" 
            fill="#f3f4f6" fillOpacity={0.2}
          />
          
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Esfuerzo"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Esfuerzo →', position: 'insideBottom', offset: -10 }}
            stroke="#6b7280"
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Importancia"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: '← Importancia', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
          />
          <ZAxis 
            type="number" 
            dataKey="z" 
            range={[50, 400]} 
            name="Gap"
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            content={() => (
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d1fae5' }} />
                  <span>Quick Win</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dbeafe' }} />
                  <span>Foundation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fef3c7' }} />
                  <span>Transformacional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f3f4f6' }} />
                  <span>Mantenimiento</span>
                </div>
              </div>
            )}
          />
          
          <Scatter 
            name="Criterios" 
            data={data}
            fill="#3b82f6"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={dimensionColors[entry.dimension] || '#3b82f6'}
                fillOpacity={0.7}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Labels de cuadrantes */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm text-gray-600">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="font-semibold text-green-900">Quick Win</p>
          <p className="text-xs text-green-700 mt-1">Alto Impacto, Bajo Esfuerzo</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="font-semibold text-blue-900">Foundation</p>
          <p className="text-xs text-blue-700 mt-1">Alto Impacto, Alto Esfuerzo</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="font-semibold text-amber-900">Transformacional</p>
          <p className="text-xs text-amber-700 mt-1">Bajo Impacto, Bajo Esfuerzo</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900">Mantenimiento</p>
          <p className="text-xs text-gray-700 mt-1">Bajo Impacto, Alto Esfuerzo</p>
        </div>
      </div>
    </div>
  )
}
