// src/app/resultados/[assessmentId]/frenos/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ParamsInput =
  | { assessmentId?: string | string[] }
  | Promise<{ assessmentId?: string | string[] }>;

function normalizeParam(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function Page({ params }: { params: ParamsInput }) {
  // Next (según versión / modo) puede entregar params como Promise
  const p = await Promise.resolve(params as any);
  const assessmentId = normalizeParam(p?.assessmentId);

  // Bridge route: NO valida UUID, solo enruta.
  // La validación, si hiciera falta, vive en /resultados/[assessmentId]
  if (!assessmentId) redirect("/resultados");

  redirect(`/resultados/${encodeURIComponent(assessmentId)}?tab=frenos`);
}
