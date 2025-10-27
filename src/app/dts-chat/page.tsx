'use client'

import { useMemo, useState } from 'react'
import AvatarPane from '../../components/AvatarPane'
import AssistantChat from '../../components/AssistantChat'
import RadarScore from '../../components/RadarScore'
import { computeScore } from '../../lib/score'
import { adviceFor, Dimension } from '../../lib/advice'

const STEPS: { id: number; dim: Dimension; q: string; explanation: string; guide: string[] }[] = [
  { 
    id: 1, 
    dim: 'Estrategia', 
    q: '¿Tienes una estrategia digital clara con objetivos específicos?',
    explanation: 'Define cómo la empresa planea implementar la transformación digital y cómo medirá su éxito.',
    guide: [
      '0-2: No tenemos estrategia digital',
      '3-5: Estamos empezando a definirla',
      '6-8: Tenemos un plan en ejecución',
      '9-10: Estrategia madura y medida'
    ]
  },
  { 
    id: 2, 
    dim: 'Procesos', 
    q: '¿Cuántos de tus procesos operativos están digitalizados?',
    explanation: 'Busca optimizar y automatizar tareas para aumentar la eficiencia y reducir costos operativos.',
    guide: [
      '0-2: Todo es manual',
      '3-5: Algunos procesos digitalizados',
      '6-8: Mayoría de procesos digitales',
      '9-10: Totalmente automatizado'
    ]
  },
  { 
    id: 3, 
    dim: 'Personas', 
    q: '¿Tu equipo domina las herramientas digitales que necesita?',
    explanation: 'Evalúa las habilidades digitales del equipo y la cultura organizacional para adoptar nuevas tecnologías.',
    guide: [
      '0-2: Habilidades básicas',
      '3-5: Conocimientos intermedios',
      '6-8: Equipo capacitado digitalmente',
      '9-10: Expertos en herramientas digitales'
    ]
  },
  { 
    id: 4, 
    dim: 'Tecnología', 
    q: '¿Usas soluciones cloud y herramientas digitales modernas?',
    explanation: 'Mide la infraestructura tecnológica, cloud y herramientas digitales disponibles para la empresa.',
    guide: [
      '0-2: Infraestructura muy limitada',
      '3-5: Algunas herramientas digitales',
      '6-8: Buen stack tecnológico',
      '9-10: Tecnología de punta (cloud, APIs)'
    ]
  },
  { 
    id: 5, 
    dim: 'Datos', 
    q: '¿Utilizas datos para tomar decisiones estratégicas?',
    explanation: 'Evalúa cómo la empresa recopila, almacena, analiza y utiliza datos para tomar decisiones estratégicas.',
    guide: [
      '0-2: Decisiones por intuición',
      '3-5: Algunos datos, poco análisis',
      '6-8: Decisiones basadas en datos',
      '9-10: Cultura data-driven completa'
    ]
  },
  { 
    id: 6, 
    dim: 'Cliente', 
    q: '¿Conoces qué tan satisfechos están tus clientes?',
    explanation: 'Analiza la experiencia del cliente en todos los canales digitales y cómo se mide su satisfacción.',
    guide: [
      '0-2: No medimos satisfacción',
      '3-5: Medición ocasional',
      '6-8: Seguimiento regular',
      '9-10: Medición continua y mejora activa'
    ]
  },
]

const LABELS = STEPS.map(s => s.dim)

export default function DtsChat() {
  const [idx, setIdx] = useState(0)
  const [values, setValues] = useState<number[]>(Array(STEPS.length).fill(5))
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [tips, setTips] = useState<Record<Dimension, string[]> | null>(null)

  const step = STEPS[idx]
  const progressPct = ((idx + 1) / STEPS.length) * 100
  const score = useMemo(() => computeScore(values, 10), [values])

  const setVal = (v: number) => {
    const next = [...values]
    next[idx] = v
    setValues(next)
    setFinalScore(null)
    setTips(null)
  }

  const calcular = () => {
    setFinalScore(score)
    const recs: Record<Dimension, string[]> = {} as any
    STEPS.forEach((s, i) => { recs[s.dim] = adviceFor(s.dim, values[i]) })
    setTips(recs)
  }

  return (
    <main className="container-page">
      {/* Contenedor para alinear título a la derecha */}
      <div className="flex justify-end mb-6">
        <div className="text-right">
          <h1 className="text-2xl font-bold">DTS — Diagnóstico</h1>
          <p>Responde de 0 a 10 y calcula tu <strong>Score</strong>.</p>
        </div>
      </div>

      {/* GRID 2x2 responsive con orden personalizado en móvil */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ✅ Avatar - order-1 en móvil, sin order en desktop */}
        <div className="order-1">
          <AvatarPane />
        </div>

        {/* ✅ Asistente - order-2 en móvil (aparece segundo), md:order-3 en desktop (abajo izq) */}
        <div className="order-2 md:order-3">
          <AssistantChat />
        </div>

        {/* ✅ Diagnóstico - order-3 en móvil (aparece tercero), md:order-2 en desktop (arriba der) */}
        <div className="order-3 md:order-2">
          <div className="card">
            <div className="card-body">
              {/* Progreso */}
              <div className="flex items-center gap-3 mb-3">
                <span className="kpi">Progreso:</span>
                <strong>{idx + 1}</strong> / {STEPS.length}
                <div className="ml-auto w-28 md:w-40">
                  <div className="progress">
                    <span style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Pregunta */}
              <h2 className="mb-3">
                <span className="font-semibold">{step.dim}: </span>
                <span className="font-normal" style={{ color: '#475569' }}>{step.q}</span>
              </h2>

              {/* Slider */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={values[idx]}
                  className="range"
                  style={{ ['--sx' as any]: `${(values[idx] - 0) * (100 / (10 - 0))}%` }}
                  onChange={(e) => setVal(+e.target.value)}
                />
                <div className="mt-2 text-2xl font-semibold">{values[idx]}</div>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className={`btn ${idx === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => setIdx(i => Math.max(0, i - 1))}
                >
                  Anterior
                </button>
                <button
                  className={`btn ${idx === STEPS.length - 1 ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => setIdx(i => Math.min(STEPS.length - 1, i + 1))}
                >
                  Siguiente
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    className="btn"
                    onClick={() => { setValues(Array(STEPS.length).fill(5)); setFinalScore(null); setTips(null) }}
                  >
                    Reset
                  </button>
                  <button className="btn btn-primary" onClick={calcular}>
                    Calcular resultado
                  </button>
                </div>
              </div>

              {/* Score preview */}
              <p className="mt-3 kpi">
                Previsualización del score (0–100):{' '}
                <span className="font-semibold" style={{ color: '#0f172a' }}>{score}</span>
              </p>

              {/* Explicación de la dimensión actual */}
              <div className="mt-3 p-3 rounded-lg" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                <p className="text-sm" style={{ color: '#0f172a' }}>
                  <span className="font-semibold" style={{ color: '#2563eb' }}>{step.dim}:</span>{' '}
                  {step.explanation}
                </p>
              </div>

              {/* Guía de escala específica por dimensión */}
              <div className="mt-3 p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs mb-2 font-semibold" style={{ color: '#475569' }}>💡 Guía rápida:</p>
                <ul className="text-xs space-y-1" style={{ color: '#64748b' }}>
                  {step.guide.map((g, i) => (
                    <li key={i}>• {g}</li>
                  ))}
                </ul>
              </div>

              {/* Resultado con consejos */}
              {finalScore !== null && (
                <div className="mt-3 card" style={{ borderColor: '#2563eb', background: '#eff6ff' }}>
                  <div className="card-body">
                    <h2 className="mb-2" style={{ color: '#2563eb' }}>Resultado</h2>
                    <p style={{ color: '#0f172a' }}>
                      Tu <strong>DTS</strong> es{' '}
                      <strong style={{ color: '#2563eb' }}>{finalScore}/100</strong>.
                    </p>
                    {tips && (
                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                        {STEPS.map((s) => (
                          <div key={s.dim}>
                            <p className="text-sm mb-1" style={{ color: '#475569' }}>
                              <strong>{s.dim} —</strong> próximos pasos:
                            </p>
                            <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: '#0f172a' }}>
                              {tips[s.dim]?.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Radar - order-4 en móvil y desktop (último) */}
        <div className="order-4">
          <RadarScore labels={LABELS} values={values} />
        </div>
      </div>
    </main>
  )
}