import Link from 'next/link'
import Image from 'next/image'
import ProblemaSection from '@/components/ProblemaSection'
import SolucionSection from '@/components/SolucionSection'

export default function Home() {
  return (
    <>
      {/* HERO SECTION - Título + Subtítulo ENCIMA del video */}
      <div className="w-full pt-12 pb-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#0f172a' }}>
            Transforma tu negocio con decisiones digitales inteligentes
          </h1>
          <p className="text-xl md:text-2xl mb-8" style={{ color: '#475569' }}>
            Evaluación rápida + plan personalizado para crecer. Te mostramos exactamente qué hacer, 
            paso a paso guiado por un avatar experto digital que habla tu idioma.
          </p>
        </div>
      </div>

      {/* Video de bienvenida - FULL WIDTH con gradiente azul */}
      <div 
        className="w-full mb-6"
        style={{ 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 25%, #bfdbfe 50%, #93c5fd 75%, #60a5fa 100%)',
          paddingTop: '24px',
          paddingBottom: '24px'
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

      {/* NUEVA SECCIÓN 2: PROBLEMA */}
      <ProblemaSection />

      {/* NUEVA SECCIÓN 3: SOLUCIÓN 7 PASOS */}
      <SolucionSection />

      <main className="container-page">

      {/* Título principal - Avatar experto digital */}
      <div className="mb-6">
        <h1 className="text-5xl md:text-6xl font-bold text-center" style={{ color: '#0f172a' }}>
          Tu <span style={{ color: '#2563eb' }}>avatar experto</span> digital 24/7 · 365 que habla su idioma
        </h1>
      </div>

      {/* Roadmap visual */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="w-full">
            <Image
              src="/roadmap.png"
              alt="Tu negocio puede ser más eficiente, rentable y conectado"
              width={1200}
              height={675}
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>
        </div>
      </div>

      {/* Cómo funciona - 3 Pasos */}
      <div className="card mb-6">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-6 text-center">
            ¿Cómo funciona?
          </h2>
          
          {/* Tabla de pasos */}
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
                {/* Paso 1 */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#2563eb',
                          fontSize: '16px'
                        }}
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
                    Contexto real de tu negocio.
                  </td>
                </tr>

                {/* Paso 2 */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#2563eb',
                          fontSize: '16px'
                        }}
                      >
                        2
                      </div>
                      <span className="font-semibold" style={{ color: '#0f172a' }}>
                        Analiza tu situación actual
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4" style={{ color: '#475569' }}>
                    DTS compara tus respuestas con las mejores prácticas.
                  </td>
                  <td className="py-4 px-4 font-semibold" style={{ color: '#0f172a' }}>
                    Tu punto de partida.
                  </td>
                </tr>

                {/* Paso 3 */}
                <tr>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center justify-center font-bold text-white rounded-lg flex-shrink-0"
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#2563eb',
                          fontSize: '16px'
                        }}
                      >
                        3
                      </div>
                      <span className="font-semibold" style={{ color: '#0f172a' }}>
                        Recibe tu plan de mejora
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4" style={{ color: '#475569' }}>
                    Te propone acciones concretas que puedes aplicar hoy.
                  </td>
                  <td className="py-4 px-4 font-semibold" style={{ color: '#0f172a' }}>
                    Eficiencia, control y resultados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Credenciales - TM Forum + MIT con logos */}
      <div className="card mb-6" style={{ background: '#eef2ff' }}>
        <div className="card-body">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            {/* Texto */}
            <div className="flex items-start gap-4">
              {/* Barra azul decorativa */}
              <div 
                className="flex-shrink-0"
                style={{
                  width: '8px',
                  height: '100%',
                  minHeight: '80px',
                  background: '#2563eb',
                  borderRadius: '4px'
                }}
              />
              
              {/* Contenido */}
              <div className="flex-1">
                <ul className="space-y-4" style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                  <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                    <strong>Miembro de TM Forum.</strong> Desarrollado sobre la metodología internacional 
                    de TM Forum, utilizada por más de 800 empresas líderes globales como{' '}
                    Telefónica, Orange, Amazon Web Services, Google y Accenture.
                  </li>
                  <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                    <strong>MIT CDO Candidate 2025.</strong>
                  </li>
                  <li className="text-lg leading-relaxed" style={{ color: '#0f172a' }}>
                    DTS pone la transformación digital al alcance de cualquier pyme, 
                    en un lenguaje claro y orientado a resultados.
                  </li>
                </ul>
              </div>
            </div>

            {/* Logos */}
            <div className="flex flex-col gap-4 items-center md:items-end">
              {/* Logo TM Forum */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <Image
                  src="/TMForum-logo.png"
                  alt="TM Forum Member"
                  width={180}
                  height={60}
                  className="h-auto"
                />
              </div>
              
              {/* Logo MIT */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <Image
                  src="/MIT-logo.png"
                  alt="MIT - Massachusetts Institute of Technology"
                  width={180}
                  height={60}
                  className="h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action - Diagnóstico */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-3">Diagnóstico</h2>
          <p className="mb-6" style={{ color: '#475569' }}>
            Evalúa tu madurez digital en 6 dimensiones.
          </p>
          <Link href="/dts-chat" className="btn btn-primary">
            Ir al Diagnóstico
          </Link>
        </div>
      </div>
      </main>
    </>
  )
}