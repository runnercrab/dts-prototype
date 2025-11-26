import React from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface DimensionScore {
  dimension: string
  asIs: number
  toBe: number
}

interface RadarChartComponentProps {
  scores: DimensionScore[]
}

export default function RadarChartComponent({ scores }: RadarChartComponentProps) {
  
  // Mapear nombres de dimensiones a español
  const dimensionLabels: Record<string, string> = {
    'strategy': 'Estrategia',
    'customer': 'Cliente',
    'technology': 'Tecnología',
    'operations': 'Operaciones',
    'culture': 'Cultura',
    'data': 'Datos'
  }

  // Preparar datos para Recharts
  const chartData = scores.map(score => ({
    dimension: dimensionLabels[score.dimension] || score.dimension,
    'AS-IS (Actual)': score.asIs,
    'TO-BE (Objetivo)': score.toBe
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">
            {payload[0].payload.dimension}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-800">
                {entry.value}/100
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              Brecha: {(payload[1].value - payload[0].value).toFixed(0)} puntos
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📊 Radar de Madurez Digital
        </h2>
        <p className="text-sm text-gray-600">
          Comparación AS-IS (estado actual) vs TO-BE (objetivo) por dimensión TM Forum DMM v5.0.1
        </p>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
            tickLine={false}
          />
          
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickCount={6}
          />
          
          {/* AS-IS (Estado Actual) */}
          <Radar
            name="AS-IS (Actual)"
            dataKey="AS-IS (Actual)"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          
          {/* TO-BE (Objetivo) */}
          <Radar
            name="TO-BE (Objetivo)"
            dataKey="TO-BE (Objetivo)"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{
              paddingTop: '20px'
            }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm font-medium text-gray-700">{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Leyenda adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">AS-IS (Actual)</p>
              <p className="text-gray-600 text-xs">
                Nivel actual de madurez digital de la organización
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">TO-BE (Objetivo)</p>
              <p className="text-gray-600 text-xs">
                Nivel objetivo definido según aspiraciones estratégicas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
