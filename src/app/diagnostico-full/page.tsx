'use client'

import { useState } from 'react'
import AvatarPane from '../../components/AvatarPane'
import AssistantChat from '../../components/AssistantChat'
import OnboardingWorkshop from '../../components/diagnostico/OnboardingWorkshop'
import { bus } from '../../lib/bus'

type Phase = 'onboarding' | 'assessment' | 'scoring' | 'results'

interface OnboardingData {
  mainPurpose: string
  digitalAmbition: string[]
  companyName: string
  sector: string
  numEmployees: number
  role: string
  evaluationScope: string
  specificArea?: string
  analysisLevel: string
  agreedToStart: boolean
}

export default function DiagnosticoFull() {
  const [phase, setPhase] = useState<Phase>('onboarding')
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)

  const handleOnboardingComplete = (data: OnboardingData) => {
    console.log('✅ Onboarding completado:', data)
    setOnboardingData(data)
    
    // Avatar da bienvenida
    const welcomeMessage = `
Perfecto ${data.companyName}. Vamos a comenzar el diagnóstico de tu madurez digital. 

Te haré 40 preguntas clave (TIER 1) organizadas en 6 dimensiones y 27 subdimensiones.

Para cada criterio, evaluarás:
1. Dónde estás HOY (As-Is, del 1 al 5)
2. Dónde quieres ESTAR (To-Be, del 1 al 5)  
3. Qué tan IMPORTANTE es (del 1 al 5)

Puedes preguntarme cualquier duda cuando quieras. ¡Empecemos!
    `.trim()
    
    bus.emit('avatar:voice', { text: welcomeMessage })
    
    // Pasar a la fase de assessment
    setTimeout(() => {
      setPhase('assessment')
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Diagnóstico Digital FULL
              </h1>
              <p className="text-sm text-gray-600">
                TM Forum DMM v5.1 - Estrategia TIER 1 + TIER 2
              </p>
            </div>
            {phase !== 'onboarding' && onboardingData && (
              <div className="text-sm text-gray-600 hidden md:block">
                <strong>{onboardingData.companyName}</strong> • {onboardingData.sector}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="w-full px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[650px_1fr] xl:grid-cols-[700px_1fr]">
          
          {/* COLUMNA IZQUIERDA: Avatar + Chat (Sticky) */}
          <div className="lg:sticky lg:top-16 lg:self-start space-y-3 h-fit">
            <AvatarPane />
            <AssistantChat />
          </div>

          {/* COLUMNA DERECHA: Contenido Principal */}
          <div>
            {phase === 'onboarding' && (
              <OnboardingWorkshop onComplete={handleOnboardingComplete} />
            )}

            {phase === 'assessment' && (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">🎯</div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: '#2563eb' }}>
                        Fase 2: Assessment
                      </h2>
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        Evaluación de criterios TIER 1
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-sm mb-2 font-semibold" style={{ color: '#15803d' }}>
                      ✓ Onboarding completado:
                    </p>
                    <div className="text-sm space-y-1" style={{ color: '#166534' }}>
                      <p>• Empresa: <strong>{onboardingData?.companyName}</strong></p>
                      <p>• Sector: <strong>{onboardingData?.sector}</strong></p>
                      <p>• Empleados: <strong>{onboardingData?.numEmployees}</strong></p>
                      <p>• Rol: <strong>{onboardingData?.role}</strong></p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg mb-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <p className="text-sm mb-2" style={{ color: '#1e40af' }}>
                      <strong>📋 Próximos componentes a integrar:</strong>
                    </p>
                    <ul className="text-xs space-y-1 list-disc pl-5" style={{ color: '#475569' }}>
                      <li>DimensionProgressMap - Mapa visual 6D + 27SD</li>
                      <li>CriterionQuestion - Evaluación As-Is / To-Be / Importance</li>
                      <li>Conectar Supabase para guardar respuestas</li>
                      <li>Implementar inferencia TIER 2 con IA</li>
                    </ul>
                  </div>

                  <p className="text-sm" style={{ color: '#64748b' }}>
                    Aquí aparecerán las preguntas de los 40 criterios TIER 1.
                  </p>

                  <div className="mt-6 flex gap-3">
                    <button 
                      className="btn"
                      onClick={() => setPhase('onboarding')}
                    >
                      ← Volver al onboarding
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => alert('Próximamente: Preguntas de criterios')}
                    >
                      Siguiente paso →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phase === 'scoring' && (
              <div className="card">
                <div className="card-body">
                  <h2 className="text-xl font-bold mb-4">
                    Fase 3: Scoring (Pendiente)
                  </h2>
                  <p style={{ color: '#64748b' }}>
                    Aquí se calculará tu puntuación de madurez digital usando las fórmulas TM Forum.
                  </p>
                </div>
              </div>
            )}

            {phase === 'results' && (
              <div className="card">
                <div className="card-body">
                  <h2 className="text-xl font-bold mb-4">
                    Fase 4: Resultados (Pendiente)
                  </h2>
                  <p style={{ color: '#64748b' }}>
                    Aquí verás tu radar de madurez, gaps y roadmap personalizado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}