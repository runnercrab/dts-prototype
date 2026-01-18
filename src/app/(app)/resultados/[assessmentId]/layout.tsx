// src/app/resultados/[assessmentId]/layout.tsx
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function ResultadosAssessmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Layout ejecutivo para Resultados (NO toca Diagnóstico)
  // - Desktop CEO-ready (ancho amplio)
  // - Márgenes consistentes
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
