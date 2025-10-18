import Link from 'next/link'

export default function Home() {
  return (
    <main className="container-page">
      <h1 className="mb-4">Digital Transformation Score</h1>
      <p className="mb-6 text-neutral-400">
        Prototipo para ayudar a pymes que te da un score del nivel de madurez digital, 
        así como madurez de los datos y otros scores futuros (como ISO's) y te devuelve 
        un score y te dice cómo mejorar.
      </p>

      {/* Video de bienvenida */}
      <div className="mb-8 w-full max-w-4xl mx-auto">
        <div className="relative w-full rounded-xl overflow-hidden border border-neutral-800 bg-black" style={{ aspectRatio: '16/9' }}>
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

      <div className="flex justify-center">
        <div className="card max-w-md w-full">
          <div className="card-body">
            <h2 className="mb-2">Diagnóstico</h2>
            <p className="mb-6">Evalúa tu madurez digital en 6 dimensiones.</p>
            <Link href="/dts-chat" className="btn btn-primary">Ir al Diagnóstico</Link>
          </div>
        </div>
      </div>
    </main>
  )
}