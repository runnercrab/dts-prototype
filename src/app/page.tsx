import Link from 'next/link'

export default function Home() {
  return (
    <main className="container-page">
      <h1 className="mb-4">Digital Transformation Score</h1>
      <p className="mb-10 text-neutral-400">
        Prototipo: diagnóstico 0–10 y asistente. El avatar irá a la izquierda, el chat a la derecha.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="card-body">
            <h2 className="mb-2">Diagnóstico</h2>
            <p className="mb-6">Evalúa tu madurez digital en 6 dimensiones.</p>
            <Link href="/dts-chat" className="btn btn-primary">Ir al Diagnóstico</Link>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h2 className="mb-2">Asistente</h2>
            <p className="mb-6">Chat libre (placeholder de momento).</p>
            <Link href="/asistente" className="btn btn-muted">Abrir Asistente</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
