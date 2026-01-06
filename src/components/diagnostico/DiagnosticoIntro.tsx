//src/components/diagnostico/DiagnosticoIntro.tsx
'use client'

import React from 'react'

type Props = {
  headerPackLabel: string
  packLabel: string
  criteriaCount: number
  progressLabel: string
  onEditOnboarding: () => void
  onStart: () => void
}

export default function DiagnosticoIntro({
  headerPackLabel,
  packLabel,
  criteriaCount,
  progressLabel,
  onEditOnboarding,
  onStart,
}: Props) {
  const criteriaLabel = criteriaCount ? String(criteriaCount) : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar (simplificado) */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="w-[100px]" />
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Diagnóstico de Madurez Digital</h1>
              <p className="text-xs sm:text-sm text-gray-600">TM Forum DMM v5.0.1 — {headerPackLabel}</p>
            </div>
            <div className="w-[100px]" />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="text-sm text-slate-500 font-semibold">Paso 2</div>
            <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              2. Diagnóstico
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              Ahora vamos a analizar tu transformación digital de forma <b>simple</b>, <b>práctica</b> y orientada a
              decisiones reales.
            </p>

            {/* Bloque 1 */}
            <div className="mt-8">
              <h3 className="text-base font-bold text-slate-900">Qué vas a hacer aquí</h3>
              <p className="mt-2 text-sm text-slate-600">
                En cada tema te pediremos <b>solo tres cosas</b>:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">1) AS-IS</div>
                  <div className="mt-1 font-semibold text-slate-900">Cómo estás hoy</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Elige el nivel (1–5) que mejor describe tu realidad actual.
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">2) TO-BE</div>
                  <div className="mt-1 font-semibold text-slate-900">Dónde quieres llegar</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Elige el nivel objetivo (1–5). No es “lo ideal”: es lo realista para tu negocio.
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">3) IMPORTANCIA</div>
                  <div className="mt-1 font-semibold text-slate-900">Para tu negocio, hoy</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Del 1 al 5: impacto en ventas, costes, eficiencia o experiencia de cliente.
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-700">
                <b>No buscamos perfección.</b> Buscamos claridad para decidir.
              </div>
            </div>

            {/* Bloque 2 */}
            <div className="mt-8">
              <h3 className="text-base font-bold text-slate-900">Cómo está organizado el diagnóstico</h3>
              <p className="mt-2 text-sm text-slate-600">
                Cubre <b>6 áreas clave del negocio</b>. Verás preguntas de cada una:
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Estrategia', 'dirección, prioridades y foco real del negocio'],
                  ['Cliente', 'captación, relación y experiencia end-to-end'],
                  ['Tecnología', 'sistemas, automatización y ciberseguridad'],
                  ['Operaciones', 'procesos, ejecución y métricas'],
                  ['Cultura', 'personas, hábitos y adopción del cambio'],
                  ['Datos', 'calidad, gobierno y uso del dato para decidir'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl border p-4">
                    <div className="font-semibold text-slate-900">{t}</div>
                    <div className="mt-1 text-slate-600">{d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-slate-600">
                👉 No necesitas saber de tecnología. Respondemos cómo funciona hoy tu empresa, no cómo “debería”.
              </div>
            </div>

            {/* Bloque 3 */}
            <div className="mt-8">
              <h3 className="text-base font-bold text-slate-900">Qué obtendrás al finalizar</h3>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  'Tus brechas clave (distancia entre AS-IS y TO-BE)',
                  'Tus frenos principales (qué bloquea hoy el negocio)',
                  'Una priorización clara (impacto vs esfuerzo)',
                  'Un plan por trimestres con seguimiento mensual',
                ].map((x) => (
                  <div key={x} className="rounded-2xl border bg-slate-50 p-4 text-slate-700">
                    {x}
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm text-slate-600">Todo en lenguaje de negocio. Sin jerga técnica.</div>
            </div>

            {/* KPI cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-slate-500">Pack</div>
                <div className="mt-1 font-mono text-sm text-slate-900">{packLabel}</div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-xs text-slate-500">Criterios</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{criteriaLabel}</div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-xs text-slate-500">Progreso</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{progressLabel}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                onClick={onEditOnboarding}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold hover:bg-slate-50"
              >
                ← Editar onboarding
              </button>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={onStart}
                  className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Empezar diagnóstico →
                </button>

                <div className="text-xs text-slate-500">
                  ⏱ Tardarás unos <b>8–12 min</b> en esta versión reducida (12 criterios).{' '}
                  <span className="ml-2">Enter ↵ para empezar.</span>
                </div>
              </div>
            </div>

            {/* Trust microcopy */}
            <div className="mt-6 text-sm text-slate-600">
              Tus respuestas se guardan automáticamente para que puedas continuar más tarde y ver el progreso.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
