// src/app/resultados/page.tsx
export const dynamic = 'force-dynamic'

export default function ResultadosPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Resultados</h1>
        <p className="text-gray-700 mb-4">
          Esta pantalla está en revisión. Mañana dejamos esto funcionando bien.
        </p>
        <p className="text-sm text-gray-500">
          (Motivo técnico: Next 16 exige Suspense si usas useSearchParams en esta ruta.)
        </p>
      </div>
    </div>
  )
}
