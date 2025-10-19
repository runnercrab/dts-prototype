'use client'

import { useMemo, useState } from 'react'
import AvatarPane from '../../components/AvatarPane'
import AssistantChat from '../../components/AssistantChat'
import RadarScore from '../../components/RadarScore'
import { computeScore } from '../../lib/score'
import { adviceFor, Dimension } from '../../lib/advice'

const STEPS: { id: number; dim: Dimension; q: string; explanation: string }[] = [
  { 
    id: 1, 
    dim: 'Estrategia', 
    q: '¿Nivel de estrategia digital (visión, planes, medición)?',
    explanation: 'Define cómo la empresa planea implementar la transformación digital y cómo medirá su éxito.'
  },
  { 
    id: 2, 
    dim: 'Procesos', 
    q: '¿Nivel de digitalización de procesos clave?',
    explanation: 'Busca optimizar y automatizar tareas para aumentar la eficiencia y reducir costos operativos.'
  },
  { 
    id: 3, 
    dim: 'Personas', 
    q: '¿Nivel de competencias digitales en el equipo?',
    explanation: 'Evalúa las habilidades digitales del equipo y la cultura organizacional para adoptar nuevas tecnologías.'
  },
  { 
    id: 4, 
    dim: 'Tecnología', 
    q: '¿Nivel de uso de herramientas digitales y cloud?',
    explanation: 'Mide la infraestructura tecnológica, cloud y herramientas digitales disponibles para la empresa.'
  },
  { 
    id: 5, 
    dim: 'Datos', 
    q: '¿Nivel de gestión y análisis de datos?',
    explanation: 'Evalúa cómo la empresa recopila, almacena, analiza y utiliza datos para tomar decisiones estratégicas.'
  },
  { 
    id: 6, 
    dim: 'Cliente', 
    q: '¿Experiencia omnicanal y medición (NPS/CSAT)?',
    explanation: 'Analiza la experiencia del cliente en todos los canales digitales y cómo se mide su satisfacción.'
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

      {/* GRID 2x2 responsive - NUEVO ORDEN */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ✅ Arriba izquierda: Avatar */}
        <AvatarPane />

        {/* ✅ Arriba derecha: Diagnóstico (Progreso, slider, botones, resultado) */}
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
              <span className="font-normal text-neutral-300">{step.q}</span>
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
              <span className="font-semibold text-neutral-200">{score}</span>
            </p>

            {/* Explicación de la dimensión actual */}
            <div className="mt-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-sm text-neutral-300">
                <span className="font-semibold text-emerald-400">{step.dim}:</span>{' '}
                {step.explanation}
              </p>
            </div>

            {/* Resultado con consejos */}
            {finalScore !== null && (
              <div className="mt-3 card border-green-700 bg-green-900/10">
                <div className="card-body">
                  <h2 className="mb-2 text-green-300">Resultado</h2>
                  <p>
                    Tu <strong>DTS</strong> es{' '}
                    <strong className="text-neutral-100">{finalScore}/100</strong>.
                  </p>
                  {tips && (
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      {STEPS.map((s) => (
                        <div key={s.dim}>
                          <p className="text-sm text-neutral-300 mb-1">
                            <strong>{s.dim} —</strong> próximos pasos:
                          </p>
                          <ul className="list-disc pl-5 text-sm text-neutral-200 space-y-1">
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

        {/* ✅ Abajo izquierda: Asistente (ahora aquí, debajo del Avatar) */}
        <AssistantChat />

        {/* ✅ Abajo derecha: Radar (ahora aquí, debajo del Diagnóstico) */}
        <RadarScore labels={LABELS} values={values} />
      </div>
    </main>
  )
}