// src/app/resultados/[assessmentId]/priorizacion/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page({
  params,
}: {
  params: { assessmentId: string };
}) {
  const { assessmentId } = params;
  redirect(`/resultados/${assessmentId}?tab=priorizacion`);
}
