import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const GOOGLE_DRIVE_VIDEO_ID = '1ULLdAeUSFMf5f5A6KyKFTfXMC863xbHt'
  const GOOGLE_DRIVE_PREVIEW_URL = `https://drive.google.com/file/d/${GOOGLE_DRIVE_VIDEO_ID}/preview`

  return (
    <>
      {/* 🟦 BLOQUE 1 — HERO */}
      <div className="w-full pt-12 pb-10 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
            La transformación digital no tiene que ser un laberinto
          </h1>

          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-10 text-slate-600 leading-snug">
            Te decimos qué mejorar, en qué orden y con qué impacto.
            <br />
            Y con claridad, una pyme avanza.
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/diagnostico-full?pack=mvp12_v1"
              className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all text-center"
            >
              Versión reducida (12 criterios)
              <div className="text-sm font-normal opacity-90">
                Exploración inicial · no es el diagnóstico completo
              </div>
            </Link>

            <Link
              href="/diagnostico-full?pack=tmf_full_v5&demo=true"
              className="px-8 py-4 rounded-2xl border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition-all text-center"
            >
              Ver ejemplo completo (129 criterios)
              <div className="text-sm font-normal opacity-80">
                Referencia metodológica · no editable
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 🟦 BLOQUE 2 — VIDEO */}
      <div
        className="w-full mb-12"
        style={{
          background:
            'linear-gradient(135deg, #eff6ff 0%, #dbeafe 25%, #bfdbfe 50%, #93c5fd 75%, #60a5fa 100%)',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
            <iframe
              src={GOOGLE_DRIVE_PREVIEW_URL}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer"
              title="Gapply - Video"
            />
          </div>
        </div>
      </div>

      {/* 🟦 BLOQUE 3 — ¿QUÉ HACE REALMENTE DTS? */}
      <section className="container-page mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
          ¿Qué hace realmente Gapply?
        </h2>
        <p className="text-center text-lg text-slate-600 mb-10">
          No es un test. Es un sistema para decidir mejor.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              step: '① Lo que realmente te frena',
              title: 'Falta de dirección práctica',
              text:
                'Sabes que deberías mejorar procesos, tecnología, equipo y datos, pero nadie te ordena el camino: qué hacer primero, cuánto cuesta y qué impacto tiene en ventas, costes y eficiencia.',
            },
            {
              step: '② Un plan claro, realista',
              title: 'Diagnóstico → frenos → decisiones',
              text:
                'Medimos AS-IS, TO-BE e Importancia, lo traducimos a frenos reales (tiempo, dinero y foco) y lo convertimos en prioridades y un roadmap trimestral que se revisa cada mes.',
            },
            {
              step: '③ No avanzas solo',
              title: 'Copiloto Digital 24/7',
              text:
                'Te guía con tu lenguaje, explica lo que no entiendas y te avisa cuando toca decidir o cuando algo bloquea el avance.',
            },
          ].map((b) => (
            <div key={b.title} className="card">
              <div className="card-body">
                <div className="text-slate-500 font-semibold mb-2">{b.step}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{b.title}</h3>
                <p className="text-slate-600">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🟦 BLOQUE 4 — 6 DIMENSIONES */}
      <section className="container-page mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
          El diagnóstico cubre 6 dimensiones del negocio
        </h2>
        <p className="text-center text-lg text-slate-600 mb-10">
          Misma lógica en versión reducida (12) y completa (129).
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            ['Estrategia', 'Prioridades claras y foco real.'],
            ['Cliente', 'Experiencia, captación y retención.'],
            ['Tecnología', 'Que el negocio no se frene.'],
            ['Operaciones', 'Procesos, ejecución y métricas.'],
            ['Equipo', 'Adopción, hábitos y forma de trabajar.'],
            ['Datos', 'Calidad, gobierno y decisiones con datos.'],
          ].map(([t, d]) => (
            <div key={t} className="card">
              <div className="card-body">
                <h3 className="text-xl font-bold mb-2 text-slate-900">{t}</h3>
                <p className="text-slate-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🟦 BLOQUE 5 — CREDENCIALES */}
      <section className="container-page mb-16">
        <div className="card bg-indigo-50">
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-6 text-center text-slate-900">
              Respaldado por estándares de clase mundial
            </h2>

            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <ul className="space-y-4 list-disc pl-6 text-lg text-slate-900">
                <li>
                  <strong>Miembro de TM Forum</strong> · Digital Maturity Model v5.0.1 y estándares para IA
                </li>
                <li>
                  <strong>MIT – Chief Digital Officer Candidate</strong>
                </li>
                <li>
                  Metodologías de grandes corporaciones, adaptadas a la realidad de las pymes.
                </li>
              </ul>

              <div className="flex flex-col gap-4 items-center">
                <Image src="/TMForum-logo.png" alt="TM Forum" width={180} height={60} />
                <Image src="/MIT-logo.png" alt="MIT" width={180} height={60} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🟦 BLOQUE 6 — SERVICIOS */}
      <main className="container-page">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
          Nuestros Servicios
        </h2>
        <p className="text-center text-lg mb-8 text-slate-600">
          Evaluaciones profesionales para impulsar tu transformación digital
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card border-t-4 border-blue-600">
            <div className="card-body">
              <span className="inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                ✓ Disponible
              </span>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Madurez Digital</h3>
              <p className="mb-4 text-slate-600">
                Evaluación basada en <strong>TM Forum DMM v5.0.1</strong>.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li>✓ 129 criterios profesionales</li>
                <li>✓ Roadmap 30/60/90 días</li>
                <li>✓ Copiloto digital guiando el proceso</li>
              </ul>
            </div>
          </div>

          <div className="card border-t-4 border-slate-400">
            <div className="card-body">
              <span className="inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                🚀 Próximamente
              </span>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Madurez de Datos</h3>
              <p className="text-slate-600">
                Gobernanza, calidad y monetización con estándares internacionales.
              </p>
            </div>
          </div>

          <div className="card border-t-4 border-slate-400">
            <div className="card-body">
              <span className="inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                🚀 Próximamente
              </span>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Certificaciones ISO</h3>
              <p className="text-slate-600">
                Preparación guiada para ISO 27001, ISO 9001 y otros estándares.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
