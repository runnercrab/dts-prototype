// src/app/(app)/resultados/[assessmentId]/ejecucion/seguimiento/page.tsx
import SeguimientoClient from "./SeguimientoClient";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  if (!isUuid(assessmentId)) {
    return (
      <div className="max-w-[1100px]">
        <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
        <p className="mt-2 text-slate-600">assessmentId inválido (UUID requerido).</p>

        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="text-sm font-semibold">Error</div>
          <div className="mt-1 text-sm">{assessmentId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px]">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
        <p className="mt-2 text-slate-600">
          Control ejecutivo: acciones priorizadas, evidencia de impacto y valor desbloqueado.
        </p>
      </div>

      <SeguimientoClient assessmentId={assessmentId} />
    </div>
  );
}
