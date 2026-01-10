// src/app/resultados/[assessmentId]/matriz/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  redirect(`/resultados/${assessmentId}?tab=overview`);
}
