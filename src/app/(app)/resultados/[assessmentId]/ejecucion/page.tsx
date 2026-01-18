// src/app/(app)/resultados/[assessmentId]/ejecucion/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EjecucionIndexPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  redirect(`/resultados/${assessmentId}/ejecucion/seguimiento`);
}
