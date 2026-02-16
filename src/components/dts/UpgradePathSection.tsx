'use client'

import Image from 'next/image'

interface UpgradePathSectionProps {
  /** Number of obstacles detected */
  numObstaculos: number
  /** Dimension names where obstacles were found, e.g. ["Datos", "Operaciones"] */
  dimensionesAfectadas: string[]
  /** Callback when CTA is clicked */
  onUpgrade?: () => void
}

export default function UpgradePathSection({
  numObstaculos,
  dimensionesAfectadas,
  onUpgrade,
}: UpgradePathSectionProps) {
  // Format dimensions as readable string: "Datos y Operaciones" or "Datos, Operaciones y Personas"
  const dimText =
    dimensionesAfectadas.length === 1
      ? dimensionesAfectadas[0]
      : dimensionesAfectadas.length === 2
        ? `${dimensionesAfectadas[0]} y ${dimensionesAfectadas[1]}`
        : `${dimensionesAfectadas.slice(0, -1).join(', ')} y ${dimensionesAfectadas[dimensionesAfectadas.length - 1]}`

  const steps = [
    {
      done: true,
      num: '✓',
      title: 'Diagnóstico completado',
      desc: 'Sabes dónde estás y qué te frena. Esto ya es más de lo que tiene el 80% de las PyMEs.',
    },
    {
      done: false,
      num: '2',
      title: 'Qué cambiar y en qué orden',
      desc: 'Programas de acción priorizados por impacto y esfuerzo real. Primero lo que más mueve la aguja con menos recursos.',
      tag: `Personalizado para tus ${numObstaculos} obstáculos`,
    },
    {
      done: false,
      num: '3',
      title: 'Un plan que puedes ejecutar esta semana',
      desc: 'Roadmap de 30, 60 y 90 días. Acciones concretas con entregables, responsables y tiempos.',
    },
    {
      done: false,
      num: '4',
      title: 'Saber si está funcionando',
      desc: 'KPIs claros, seguimiento trimestral y un panel que revisas en 5 minutos. Sin sorpresas.',
    },
  ]

  return (
    <section
      className="w-full rounded-[18px] border-[1.5px] border-[#e2e6ef] overflow-hidden"
      style={{
        background:
          'linear-gradient(170deg, #ffffff 0%, #f0f8ff 60%, #ffffff 100%)',
      }}
    >
      <div className="px-6 py-10 sm:px-10 sm:py-12 relative">
        {/* Decorative gradient blob */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(26,144,255,0.06) 0%, transparent 70%)',
          }}
        />

        {/* ── Headline ── */}
        <h2
          className="text-[1.65rem] sm:text-[1.8rem] font-bold leading-[1.25] tracking-tight text-[#1a1a2e] mb-2 max-w-[600px]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Ya sabes dónde estás.
          <br />
          Ahora toca decidir hacia dónde vas.
        </h2>
        <p className="text-base text-[#5a6078] mb-8 max-w-[560px]">
          Tu diagnóstico ha detectado{' '}
          <strong className="text-[#1a1a2e] font-semibold">
            {numObstaculos} obstáculo{numObstaculos !== 1 ? 's' : ''}
          </strong>{' '}
          en{' '}
          <strong className="text-[#1a1a2e] font-semibold">{dimText}</strong>.
          Estos no se resuelven solos — pero tienen solución concreta.
        </p>

        {/* ── Path steps ── */}
        <div className="flex flex-col mb-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 relative py-3">
              {/* Vertical connector line */}
              {i < steps.length - 1 && (
                <div
                  className="absolute left-[15px] top-[46px] bottom-[-2px] w-[2px]"
                  style={{
                    background:
                      'linear-gradient(to bottom, #1a90ff, #e2e6ef)',
                  }}
                />
              )}

              {/* Dot */}
              <div
                className={`
                  w-8 h-8 min-w-[32px] rounded-full flex items-center justify-center
                  text-xs font-bold relative z-10
                  ${
                    step.done
                      ? 'bg-[#10b981] border-[2.5px] border-[#10b981] text-white'
                      : 'bg-white border-[2.5px] border-[#1a90ff] text-[#1a90ff]'
                  }
                `}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {step.num}
              </div>

              {/* Content */}
              <div>
                <h4 className="text-[0.95rem] font-semibold text-[#1a1a2e] mb-0.5 tracking-tight">
                  {step.title}
                </h4>
                <p className="text-sm text-[#5a6078] leading-relaxed max-w-[500px]">
                  {step.desc}
                </p>
                {step.tag && (
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 text-[0.7rem] font-bold text-[#1a90ff] bg-[#e8f4ff] border border-[#bfdbfe] rounded-md"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {step.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Data point ── */}
        <div className="flex items-center gap-3 bg-white border-[1.5px] border-[#e2e6ef] rounded-xl px-5 py-4 mb-8 max-w-[560px]">
          <Image
            src="/icons/graph.png"
            alt=""
            width={40}
            height={40}
            className="rounded-[10px] object-contain min-w-[40px]"
          />
          <p className="text-sm text-[#5a6078] leading-relaxed">
            Según el MIT, las empresas que miden activamente su transformación{' '}
            <strong className="text-[#1a1a2e] font-semibold">
              superan a su sector en +16 puntos de margen neto
            </strong>
            . El diagnóstico es el primer paso. El seguimiento es lo que marca
            la diferencia.
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="flex items-center gap-5 flex-wrap">
          <button
            onClick={onUpgrade}
            className="
              inline-flex items-center px-8 py-3.5 
              bg-[#1a90ff] hover:bg-[#0a6fd4] 
              text-white text-base font-semibold 
              rounded-[14px] border-0 cursor-pointer
              transition-all duration-200 ease-out
              hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(26,144,255,0.2)]
              tracking-tight
            "
          >
            Ver mi plan de acción →
          </button>
          <span className="text-[0.82rem] text-[#8b8fa8]">
            Sin compromiso · Cancela cuando quieras
          </span>
        </div>
      </div>
    </section>
  )
}