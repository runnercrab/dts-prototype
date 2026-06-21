// src/app/resultados/[assessmentId]/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import NavigationFooter from "@/components/shell/NavigationFooter";
import { isProductionDtsWriteBlocked } from "@/lib/dts/prodGate";

export const dynamic = "force-dynamic";

export default async function ResultadosAssessmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  // 005 — En producción el motor legacy (app) está congelado: redirige al
  // flujo canónico /dts. Cubre todo el subárbol legacy (lectura + ejecución +
  // avatar HeyGen del layout de grupo). Preview/local quedan intactos.
  if (isProductionDtsWriteBlocked()) {
    redirect(`/dts/resultados/${assessmentId}`);
  }

  return (
    <div className="w-full">
      {children}
      <NavigationFooter assessmentId={assessmentId} />
    </div>
  );
}