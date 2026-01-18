import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EjecucionIndex({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  redirect(`/resultados/${assessmentId}/ejecucion/programas`);
}
