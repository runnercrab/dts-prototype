// src/app/resultados/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type TabKey = "overview" | "frenos" | "priorizacion";
function normalizeTab(v: any): TabKey | null {
  const raw = (v || "").toString().toLowerCase().trim();
  if (raw === "overview" || raw === "frenos" || raw === "priorizacion")
    return raw;
  return null;
}

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams?: Promise<{ assessmentId?: string; tab?: string }>;
}) {
  const sp = (await searchParams) || {};
  const assessmentId = sp.assessmentId ? String(sp.assessmentId) : "";
  const tab = normalizeTab(sp.tab);

  // ✅ /resultados?assessmentId=... -> /resultados/<id>?tab=...
  if (assessmentId && isUuid(assessmentId)) {
    const qs = tab ? `?tab=${tab}` : "";
    redirect(`/resultados/${assessmentId}${qs}`);
  }

  // Fallback informativo si entran sin id o con id inválido
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Resultados</h1>

        <p className="text-gray-700 mb-4">
          Esta ruta ya no muestra resultados directamente.
          <br />
          Necesita un <span className="font-mono">assessmentId</span> válido.
        </p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Ejemplo válido:
          <div className="mt-2 font-mono text-xs text-slate-800">
            /resultados?assessmentId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          </div>
          <div className="mt-2">
            (Te redirigirá automáticamente a{" "}
            <span className="font-mono">/resultados/&lt;assessmentId&gt;</span>)
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Link
            href="/diagnostico-full"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            Ir al diagnóstico
          </Link>

          <span className="text-xs text-slate-500">
            o abre resultados con un assessmentId válido.
          </span>
        </div>
      </div>
    </div>
  );
}
