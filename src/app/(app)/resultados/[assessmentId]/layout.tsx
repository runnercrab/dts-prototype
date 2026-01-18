// src/app/resultados/[assessmentId]/layout.tsx
import type { ReactNode } from "react";
import NavigationFooter from "@/components/shell/NavigationFooter";

export const dynamic = "force-dynamic";

export default async function ResultadosAssessmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  return (
    <div className="w-full">
      {children}
      <NavigationFooter assessmentId={assessmentId} />
    </div>
  );
}