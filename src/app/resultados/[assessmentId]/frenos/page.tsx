// src/app/resultados/[assessmentId]/frenos/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function Page({ params }: { params: { assessmentId: string } }) {
  const { assessmentId } = params;

  // Si el id es inválido, cae en /resultados (pantalla informativa)
  if (!assessmentId || !isUuid(assessmentId)) {
    redirect("/resultados");
  }

  // ✅ Unificamos navegación: tabs por querystring
  redirect(`/resultados/${assessmentId}?tab=frenos`);
}
