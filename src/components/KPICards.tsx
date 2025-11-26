import React from 'react'
import { TrendingUp, Target, AlertCircle, Zap } from 'lucide-react'

interface KPICardsProps {
  globalScore: number
  totalInitiatives: number
  criticalDimension: string
  quickWins: number
}

export default function KPICards({ 
  globalScore, 
  totalInitiatives, 
  criticalDimension,
  quickWins 
}: KPICardsProps) {
  
  // Determinar nivel de madurez según TM Forum DMM
  const getMaturityLevel = (score: number): { level: string; color: string; bgColor: string } => {
    if (score < 20) return { level: 'Inicial', color: '#ef4444', bgColor: '#fee2e2' }
    if (score < 40) return { level: 'Emergente', color: '#f97316', bgColor: '#ffedd5' }
    if (score < 60) return { level: 'Definido', color: '#f59e0b', bgColor: '#fef3c7' }
    if (score < 80) return { level: 'Gestionado', color: '#3b82f6', bgColor: '#dbeafe' }
    return { level: 'Optimizado', color: '#10b981', bgColor: '#d1fae5' }
  }

  const maturity = getMaturityLevel(globalScore)

  const cards = [
    {
      title: 'Score Global',
      value: `${globalScore}/100`,
      subtitle: maturity.level,
      icon: Target,
      color: maturity.color,
      bgColor: maturity.bgColor,
      description: 'Nivel de Madurez Digital'
    },
    {
      title: 'Total Iniciativas',
      value: totalInitiatives,
      subtitle: 'criterios con brecha',
      icon: TrendingUp,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      description: 'Oportunidades de mejora'
    },
    {
      title: 'Dimensión Crítica',
      value: criticalDimension,
      subtitle: 'requiere atención',
      icon: AlertCircle,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      description: 'Área de mayor impacto'
    },
    {
      title: 'Quick Wins',
      value: quickWins,
      subtitle: 'iniciativas rápidas',
      icon: Zap,
      color: '#10b981',
      bgColor: '#d1fae5',
      description: 'Alto impacto, bajo esfuerzo'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow"
            style={{ borderLeftColor: card.color }}
          >
            {/* Header con icono */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: card.bgColor }}
              >
                <Icon size={24} color={card.color} />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {card.description}
              </span>
            </div>

            {/* Valor principal */}
            <div className="mb-2">
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: card.color }}
              >
                {card.value}
              </div>
              <div className="text-sm text-gray-600">
                {card.subtitle}
              </div>
            </div>

            {/* Título */}
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {card.title}
            </div>
          </div>
        )
      })}
    </div>
  )
}
