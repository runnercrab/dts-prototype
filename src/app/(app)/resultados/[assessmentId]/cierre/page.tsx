// src/app/resultados/[assessmentId]/cierre/page.tsx
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function CierreDiagnosticoPage() {
  const router = useRouter();
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => (params?.assessmentId || "").toString().trim(), [params]);
  const valid = assessmentId && isUuid(assessmentId);

  const hrefFrenos = valid ? `/resultados/${assessmentId}/frenos` : `/resultados`;
  const hrefResultados = valid ? `/resultados/${assessmentId}` : `/resultados`;

  // ✅ Canonical: PROGRAMAS (Big4)
  const hrefProgramas = valid
  ? `/resultados/${assessmentId}/ejecucion/programas`
  : `/resultados`;


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(hrefFrenos)}
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            title="Volver a Frenos"
          >
            ← Volver a Frenos
          </button>

          <div className="text-sm text-slate-500">Cierre del diagnóstico</div>

          <div />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {!valid ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            assessmentId inválido.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="text-2xl font-semibold text-slate-900">Diagnóstico completado</div>

            <div className="mt-3 text-slate-700 leading-relaxed">
              Ya tienes una visión clara de tu situación digital actual.
              <br />
              Has identificado qué áreas requieren atención prioritaria y qué frenos reales están impidiendo avanzar.
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="text-sm font-semibold text-slate-900">Qué has obtenido con este diagnóstico:</div>

              <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
                <li>Una priorización clara de los criterios con mayor impacto en el negocio</li>
                <li>Los frenos concretos que explican por qué hoy no avanzas</li>
                <li>Un punto de partida común para decidir con criterio, no por intuición</li>
              </ul>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <div className="text-sm font-semibold text-slate-900">El siguiente paso</div>

              <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                El siguiente paso no es ejecutar todavía.
                <br />
                Antes de aprobar proyectos, conviene explorar qué <b>programas</b> conviene activar primero y qué
                <b> acciones</b> concretas los hacen realidad.
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => router.push(hrefProgramas)}
                className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                title="Ver programas recomendados basados en tus resultados"
              >
                Ver programas recomendados
              </button>

              <button
                onClick={() => router.push(hrefResultados)}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                title="Volver al Resultado Ejecutivo"
              >
                Volver a resultados
              </button>
            </div>

            <div className="mt-6 text-xs text-slate-500">
              Nota: esto no aprueba proyectos ni genera un roadmap. Solo ayuda a explorar opciones.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
