import Image from 'next/image'
import Link from 'next/link'
import ClaridadSection from '@/components/ClaridadSection'
import ProblemaSection from '@/components/ProblemaSection'
import SolucionSection from '@/components/SolucionSection'

const DEMO_ASSESSMENT_ID = 'b4b63b9b-4412-4628-8a9a-527b0696426a'

export default function Home() {
  return (
    <>
      {/* HERO SECTION - Título + Subtítulo + CTA */}
      <div id="inicio" className="w-full pt-12 pb-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#0f172a' }}>
            La transformación digital no tiene que ser un laberinto
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold mb-8" style={{ color: '#475569' }}>
            Tu GPS empresarial que te muestra el camino, paso a paso.
          </h2>

          {/* CTA del HERO: Ejemplo completo (sin demo=1) */}
          <div className="flex justify-center">
            <Link
              href={`/diagnostico-full?assessmentId=${DEMO_ASSESSMENT_ID}`}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Ver ejemplo completo
            </Link>
          </div>
        </div>
      </div>

      {/* Video de bienvenida - FULL WIDTH */}
      <div
        className="w-full mb-6"
        style={{
          background:
            'linear-gradient(135deg, #eff6ff 0%, #dbeafe 25%, #bfdbfe 50%, #93c5fd 75%, #60a5fa 100%)',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
            <video
              src="/Welcome.mp4"
              className="w-full h-full object-cover"
              controls
              controlsList="nofullscreen nodownload noremoteplayback"
              disablePictureInPicture
              muted={false}
              playsInline
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Claridad (después del video) */}
      <ClaridadSection />

      {/* SECCIÓN 2: PROBLEMA */}
      <ProblemaSection />

      {/* SECCIÓN 3: SOLUCIÓN 7 PASOS */}
      <SolucionSection />

      <main className="container-page">
        {/* SECCIÓN 4: SERVICIOS */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#0f172a' }}>
            Nuestros Servicios
          </h2>
          <p className="text-center text-lg mb-8" style={{ color: '#475569' }}>
            Herramientas profesionales de evaluación para impulsar tu transformación digital
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Servicio 1: Madurez Digital */}
            <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
              <div className="card-body">
                <div className="mb-3">
                  <span
                    className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
                    style={{ background: '#dcfce7', color: '#166534' }}
                  >
                    ✓ Disponible
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3" style={{ color: '#0f172a' }}>
                  Madurez Digital
                </h3>
                <p className="mb-4" style={{ color: '#475569' }}>
                  Evaluación completa basada en <strong>TM Forum DMM v5.0.1</strong>. Analiza 6
                  dimensiones clave de tu organización: Customer, Strategy, Technology, Operations,
                  Culture y Data.
                </p>

                <ul className="space-y-2" style={{ color: '#475569' }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#2563eb' }}>✓</span>
                    <span>129 criterios de evaluación profesional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#2563eb' }}>✓</span>
                    <span>Plan de acción 30/60/90 días</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#2563eb' }}>✓</span>
                    <span>Avatar experto guiando el proceso</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Servicio 2: Madurez de Datos */}
            <div className="card" style={{ borderTop: '4px solid #64748b' }}>
              <div className="card-body">
                <div className="mb-3">
                  <span
                    className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
                    style={{ background: '#fef3c7', color: '#92400e' }}
                  >
                    🚀 Próximamente
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3" style={{ color: '#0f172a' }}>
                  Madurez de Datos
                </h3>
                <p className="mb-4" style={{ color: '#475569' }}>
                  Evaluación especializada de gobernanza, calidad y monetización de datos. Basada en
                  estándares internacionales de gestión de datos.
                </p>

                <ul className="space-y-2" style={{ color: '#64748b' }}>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>Gobernanza de datos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>Calidad y consistencia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>Monetización de datos</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Servicio 3: Certificaciones ISO */}
            <div className="card" style={{ borderTop: '4px solid #64748b' }}>
              <div className="card-body">
                <div className="mb-3">
                  <span
                    className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
                    style={{ background: '#fef3c7', color: '#92400e' }}
                  >
                    🚀 Próximamente
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3" style={{ color: '#0f172a' }}>
                  Certificaciones ISO
                </h3>
                <p className="mb-4" style={{ color: '#475569' }}>
                  Preparación guiada para certificaciones ISO 27001 (Seguridad), ISO 9001 (Calidad) y
                  otros estándares internacionales.
                </p>

                <ul className="space-y-2" style={{ color: '#64748b' }}>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>ISO 27001 - Seguridad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>ISO 9001 - Calidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>○</span>
                    <span>Otros estándares</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: Avatar experto (SIN imagen) */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8" style={{ color: '#0f172a' }}>
            Tu <span style={{ color: '#2563eb' }}>avatar experto</span> digital 24/7 que habla tu idioma
          </h2>
        </div>

        {/* SECCIÓN 6: Cómo funciona */}
        <div id="como-funciona" className="card mb-12">
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#0f172a' }}>
              ¿Cómo funciona?
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th className="text-left py-3 px-4 font-bold text-lg" style={{ color: '#0f172a' }}>
                      Paso
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-lg" style={{ color: '#0f172a' }}>
                      Qué hace
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-lg" style={{ color: '#0f172a' }}>
                      Qué obtienes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                          style={{ width: '32px', height: '32px', background: '#2563eb', fontSize: '16px' }}
                        >
                          1
                        </div>
                        <span className="font-semibold" style={{ color: '#0f172a' }}>
                          Conversa con tu asesor digital
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" style={{ color: '#475569' }}>
                      El avatar te hace preguntas simples sobre cómo gestionas tu empresa.
                    </td>
                    <td className="py-4 px-4 font-semibold" style={{ color: '#0f172a' }}>
                      Contexto real de tu negocio
                    </td>
                  </tr>

                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                          style={{ width: '32px', height: '32px', background: '#2563eb', fontSize: '16px' }}
                        >
                          2
                        </div>
                        <span className="font-semibold" style={{ color: '#0f172a' }}>
                          Analiza tu situación actual
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" style={{ color: '#475569' }}>
                      Gapply compara tus respuestas con las mejores prácticas internacionales.
                    </td>
                    <td className="py-4 px-4 font-semibold" style={{ color: '#0f172a' }}>
                      Diagnóstico completo
                    </td>
                  </tr>

                  <tr>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                          style={{ width: '32px', height: '32px', background: '#2563eb', fontSize: '16px' }}
                        >
                          3
                        </div>
                        <span className="font-semibold" style={{ color: '#0f172a' }}>
                          Recibe tu plan de acción
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4" style={{ color: '#475569' }}>
                      Plan personalizado 30/60/90 días con acciones concretas priorizadas.
                    </td>
                    <td className="py-4 px-4 font-semibold" style={{ color: '#0f172a' }}>
                      Roadmap de transformación
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECCIÓN 7: Credenciales (SIN SECOT) */}
        <div className="card mb-12" style={{ background: '#eef2ff' }}>
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#0f172a' }}>
              Respaldado por las Mejores Instituciones
            </h2>

            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0"
                  style={{
                    width: '8px',
                    height: '100%',
                    minHeight: '120px',
                    background: '#2563eb',
                    borderRadius: '4px',
                  }}
                />

                <div className="flex-1">
                  <ul className="space-y-4" style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                    <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                      <strong>Miembro de TM Forum</strong> - Desarrollado sobre la metodología internacional
                      <strong> Digital Maturity Model v5.0.1</strong>, utilizada por más de 800 empresas
                      líderes globales como Telefónica, Orange, Amazon Web Services, Google y Accenture.
                    </li>
                    <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                      <strong>MIT Chief Digital Officer Candidate 2025</strong> - Formación avanzada en
                      transformación digital del Massachusetts Institute of Technology.
                    </li>
                    <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                      Gapply democratiza la transformación digital, haciéndola accesible para cualquier PYME
                      con metodologías de clase mundial.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center md:items-end">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <Image src="/TMForum-logo.png" alt="TM Forum Member" width={180} height={60} className="h-auto" />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <Image src="/MIT-logo.png" alt="MIT" width={180} height={60} className="h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 8: FAQ */}
        <div id="faq" className="card mb-12">
          <div className="card-body">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: '#0f172a' }}>
              Preguntas Frecuentes
            </h2>

            <div className="space-y-6">
              <div className="border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#0f172a' }}>
                  ¿Cuánto tiempo toma completar la evaluación?
                </h3>
                <p style={{ color: '#475569' }}>
                  La evaluación completa toma entre 45-60 minutos. Puedes guardar tu progreso y continuar más tarde.
                  El avatar te guía paso a paso para que sea un proceso ágil y claro.
                </p>
              </div>

              <div className="border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#0f172a' }}>
                  ¿Necesito conocimientos técnicos?
                </h3>
                <p style={{ color: '#475569' }}>
                  No. Gapply está diseñado para CEOs, directores y propietarios de negocios. Las preguntas están en
                  lenguaje claro, sin jerga técnica. El avatar te ayuda a entender cada concepto.
                </p>
              </div>

              <div className="border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#0f172a' }}>
                  ¿Qué incluye el plan de acción?
                </h3>
                <p style={{ color: '#475569' }}>
                  Recibes un roadmap personalizado 30/60/90 días con acciones concretas priorizadas por impacto y esfuerzo.
                  Incluye Quick Wins (victorias rápidas) y proyectos transformacionales de mayor alcance.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#0f172a' }}>
                  ¿Es solo para grandes empresas?
                </h3>
                <p style={{ color: '#475569' }}>
                  No. Gapply está especialmente diseñado para PYMEs. Utilizamos la misma metodología profesional que usan
                  empresas Fortune 500, pero adaptada a las realidades y presupuestos de empresas pequeñas y medianas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
