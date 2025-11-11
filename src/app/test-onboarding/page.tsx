'use client'

import { useState } from 'react'
import AssistantChat from '@/components/AssistantChat'
import OnboardingWorkshop from '@/components/diagnostico/OnboardingWorkshop'
import { bus } from '@/lib/bus'

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

export default function OnboardingTest() {
  const [completed, setCompleted] = useState(false)
  const [data, setData] = useState<OnboardingData | null>(null)

  const handleComplete = (onboardingData: OnboardingData) => {
    console.log('✅ Onboarding completado:', onboardingData)
    setData(onboardingData)
    setCompleted(true)

    // Mensaje del asistente al completar
    const welcomeMessage = `
¡Enhorabuena ${onboardingData.companyName}! Has completado el onboarding. 

Estás listo para comenzar con las 40 preguntas del diagnóstico TIER 1. 

Si tienes alguna duda antes de empezar, pregúntame lo que necesites. Cuando estés preparado, haz clic en "Comenzar Diagnóstico".
    `.trim()
    
    bus.emit('avatar:voice', { text: welcomeMessage })
  }

  const handleStartAssessment = () => {
    alert('🚀 En producción, aquí comenzaría la Fase 2: Assessment con las preguntas de criterios TIER 1')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Test de Onboarding</h1>
          <p className="text-sm text-gray-600">
            Página de prueba con asistente siempre visible
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          
          {/* COLUMNA IZQUIERDA: Asistente (Sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start h-fit">
            <div className="card">
              <div className="card-body">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">💬 Asistente DTS</h3>
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {!completed 
                      ? 'Pregúntame cualquier duda sobre el onboarding'
                      : '¿Tienes dudas antes de empezar el diagnóstico?'
                    }
                  </p>
                </div>
                
                <AssistantChat />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Onboarding o Resumen */}
          <div>
            {!completed ? (
              <OnboardingWorkshop onComplete={handleComplete} />
            ) : (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl">🎉</div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: '#10b981' }}>
                        ¡Enhorabuena!
                      </h2>
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        Onboarding completado con éxito
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-sm mb-3 font-semibold" style={{ color: '#15803d' }}>
                      Datos de tu empresa:
                    </p>
                    <div className="space-y-2 text-sm" style={{ color: '#166534' }}>
                      <div className="flex justify-between">
                        <span>Empresa:</span>
                        <strong>{data?.companyName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Sector:</span>
                        <strong>{data?.sector}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Empleados:</span>
                        <strong>{data?.numEmployees}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tu rol:</span>
                        <strong>{data?.role}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alcance:</span>
                        <strong>
                          {data?.evaluationScope === 'full-organization' && 'Toda la organización'}
                          {data?.evaluationScope === 'functional-area' && 'Área funcional'}
                          {data?.evaluationScope === 'business-unit' && 'Unidad de negocio'}
                          {data?.evaluationScope === 'pilot-project' && 'Proyecto piloto'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg mb-4" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <p className="text-sm mb-2" style={{ color: '#1e40af' }}>
                      <strong>📋 Siguiente paso: Fase 2 - Assessment</strong>
                    </p>
                    <p className="text-xs" style={{ color: '#475569' }}>
                      Te haremos 40 preguntas clave (TIER 1) sobre tu madurez digital. 
                      Luego, la IA inferirá 89 criterios adicionales (TIER 2).
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      className="btn"
                      onClick={() => { setCompleted(false); setData(null) }}
                    >
                      ← Volver a empezar
                    </button>
                    <button 
                      className="btn btn-primary flex-1"
                      onClick={handleStartAssessment}
                    >
                      Comenzar Diagnóstico →
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: '#fef3c7', border: '1px solid #fde047' }}>
                    <strong>💡 Tip:</strong> Si tienes dudas, pregunta en el asistente de la izquierda 
                    antes de comenzar el diagnóstico.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}