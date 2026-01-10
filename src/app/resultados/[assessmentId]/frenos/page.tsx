// src/app/resultados/[assessmentId]/frenos/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page({ params }: { params: { assessmentId: string } }) {
  redirect(`/resultados/${params.assessmentId}?tab=frenos`);
}
