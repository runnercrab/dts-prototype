import Image from 'next/image'
import Link from 'next/link'
import ClaridadSection from '@/components/ClaridadSection'
import ProblemaSection from '@/components/ProblemaSection'
import SolucionSection from '@/components/SolucionSection'

export default function Home() {
  // ✅ 1) Pega aquí el ID del vídeo de Google Drive
  // Ejemplo link:
  // https://drive.google.com/file/d/1AbCDefGhIjKlMnOPqRsTuVwXyZ123456/view?usp=sharing
  // ID = 1AbCDefGhIjKlMnOPqRsTuVwXyZ123456
  // link google drive real :https://drive.google.com/file/d/1ULLdAeUSFMf5f5A6KyKFTfXMC863xbHt/view?usp=sharing
  const GOOGLE_DRIVE_VIDEO_ID = '1ULLdAeUSFMf5f5A6KyKFTfXMC863xbHt'
  const GOOGLE_DRIVE_PREVIEW_URL = `https://drive.google.com/file/d/${GOOGLE_DRIVE_VIDEO_ID}/preview`

  return (
    <>
      {/* HERO SECTION */}
      <div id="inicio" className="w-full pt-12 pb-10 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
            La transformación digital no tiene que ser un laberinto
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold mb-10 text-slate-600">
            Tu GPS empresarial que te muestra el camino, paso a paso.
          </h2>

          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* PRIMARY */}
            <Link
              href="/diagnostico-full?pack=mvp12_v1"
              className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all text-center"
            >
              Versión reducida (12 criterios)
              <div className="text-sm font-normal opacity-90">
                Exploración inicial · no es el diagnóstico completo
              </div>
            </Link>

            {/* SECONDARY */}
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

      {/* VIDEO */}
      <div
        className="w-full mb-8"
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

          {/* (Opcional) fallback si no quieres que se quede “en blanco” cuando no hay ID */}
          {GOOGLE_DRIVE_VIDEO_ID === 'PASTE_YOUR_FILE_ID_HERE' && (
            <p className="text-center text-sm text-slate-600 mt-3">
              ⚠️ Falta configurar el ID del vídeo de Google Drive en <code>GOOGLE_DRIVE_VIDEO_ID</code>.
            </p>
          )}
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <ClaridadSection />
      <ProblemaSection />
      <SolucionSection />

      <main className="container-page">
        {/* SERVICIOS */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
            Nuestros Servicios
          </h2>
          <p className="text-center text-lg mb-8 text-slate-600">
            Evaluaciones profesionales para impulsar tu transformación digital
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Madurez Digital */}
            <div className="card border-t-4 border-blue-600">
              <div className="card-body">
                <span className="inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  ✓ Disponible
                </span>

                <h3 className="text-xl font-bold mb-3 text-slate-900">Madurez Digital</h3>

                <p className="mb-4 text-slate-600">
                  Evaluación basada en <strong>TM Forum DMM v5.0.1</strong> sobre las 6 dimensiones
                  clave de la organización.
                </p>

                <ul className="space-y-2 text-slate-600">
                  <li>✓ 129 criterios profesionales</li>
                  <li>✓ Roadmap 30/60/90 días</li>
                  <li>✓ Avatar experto guiando el proceso</li>
                </ul>
              </div>
            </div>

            {/* Próximos */}
            <div className="card border-t-4 border-slate-400">
              <div className="card-body">
                <span className="inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                  🚀 Próximamente
                </span>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Madurez de Datos</h3>
                <p className="text-slate-600">
                  Gobernanza, calidad y monetización de datos con estándares internacionales.
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
        </div>

        {/* CREDENCIALES */}
        <div className="card mb-12 bg-indigo-50">
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-6 text-center text-slate-900">
              Respaldado por estándares de clase mundial
            </h2>

            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <ul className="space-y-4 list-disc pl-6 text-lg text-slate-900">
                <li>
                  <strong>Miembro de TM Forum</strong> · Digital Maturity Model v5.0.1
                </li>
                <li>
                  <strong>MIT – Chief Digital Officer Candidate</strong>
                </li>
                <li>
                  Democratizamos metodologías usadas por grandes corporaciones para PYMEs.
                </li>
              </ul>

              <div className="flex flex-col gap-4 items-center">
                <Image src="/TMForum-logo.png" alt="TM Forum" width={180} height={60} />
                <Image src="/MIT-logo.png" alt="MIT" width={180} height={60} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
