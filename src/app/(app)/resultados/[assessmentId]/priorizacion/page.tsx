// src/app/resultados/[assessmentId]/priorizacion/page.tsx
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
  const p = await Promise.resolve(params as any);
  const assessmentId = normalizeParam(p?.assessmentId);

  // Bridge route: NO valida UUID, solo enruta.
  if (!assessmentId) redirect("/resultados");

  redirect(`/resultados/${encodeURIComponent(assessmentId)}?tab=priorizacion`);
}
