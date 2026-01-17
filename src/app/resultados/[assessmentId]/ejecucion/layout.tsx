// src/app/resultados/[assessmentId]/ejecucion/layout.tsx
import EjecucionTabsClient from "@/components/ejecucion/EjecucionTabsClient";

export const dynamic = "force-dynamic";

export default async function EjecucionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      <EjecucionTabsClient assessmentId={assessmentId}>
        {children}
      </EjecucionTabsClient>
    </div>
  );
}
