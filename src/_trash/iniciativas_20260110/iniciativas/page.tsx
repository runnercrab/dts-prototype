"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function IniciativasIndexPage() {
  const params = useParams<{ assessmentId: string }>();

  const assessmentId = useMemo(() => {
    return (params?.assessmentId || "").toString().trim();
  }, [params]);

  // ✅ Si no hay assessmentId válido, mostramos error visible (no 404)
  if (!assessmentId || !isUuid(assessmentId)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            assessmentId inválido.
          </div>
        </div>
      </main>
    );
  }

  // ✅ Lista “hardcodeada” SOLO para navegar hoy.
  // (Luego la puedes alimentar de tu endpoint de priorización o de pack)
  const items = [
    { code: "3.4.1", title: "Seguridad Cibernética" },
    { code: "1.1.2", title: "Autoservicio Asistido" },
    { code: "4.1.1", title: "Automatización de Operaciones" },
    { code: "6.2.1", title: "Insights Accionables" },
    { code: "1.1.1", title: "Gestión de Relaciones con Clientes" },
    { code: "3.1.1", title: "Arquitectura Componible" },
    { code: "5.5.1", title: "Cultura de Seguridad" },
    { code: "5.1.1", title: "Liderazgo Digital" },
    { code: "4.2.2", title: "Analítica de Procesos" },
    { code: "2.5.4", title: "Marco de Gobernanza de IA" },
    { code: "2.1.3", title: "Creación de Valor Impulsada por Innovación" },
    { code: "6.1.1", title: "Estrategia de Datos" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/resultados/${assessmentId}?tab=priorizacion`}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ← Volver
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href={`/resultados/${assessmentId}`}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Resultado Ejecutivo
              </Link>
            </div>

            <div className="flex-1 text-center">
              <div className="text-lg sm:text-xl font-semibold text-slate-900">
                Iniciativas por criterio
              </div>
              <div className="text-xs sm:text-sm text-slate-600">
                Elige un criterio para ver opciones de mejora comparables.
              </div>
            </div>

            <button
              disabled
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium"
              title="Disponible cuando comparemos iniciativas"
            >
              Comparar iniciativas
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Aquí todavía no hay roadmap. Solo opciones por criterio (como lo haría una Big4,
          pero en formato SaaS).
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Nota (MVP)</div>
          <div className="mt-1">
            MVP: priorización basada en tus respuestas (gap × importancia). No son acciones:
            son áreas donde concentrar la atención.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {items.map((it) => {
            const slug = it.code.replaceAll(".", "-"); // ✅ AQUÍ ESTÁ LA CLAVE
            return (
              <div key={it.code} className="px-5 py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-700">
                      {it.code}
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{it.title}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Ver capacidades e iniciativas (opciones) para este criterio
                  </div>
                </div>

                <Link
                  href={`/resultados/${assessmentId}/iniciativas/${slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Abrir →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
