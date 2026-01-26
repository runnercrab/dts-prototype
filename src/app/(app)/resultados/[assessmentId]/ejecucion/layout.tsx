// src/app/(app)/resultados/[assessmentId]/ejecucion/layout.tsx
import Link from "next/link";
import EjecucionTabsClient from "@/components/ejecucion/EjecucionTabsClient";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type Gate = {
  assessment_id: string;
  pack: string;
  required_count: number;
  complete_count: number;
  missing_count: number;
  completion_rate: number;
  can_execute: boolean;
  reason: string;
};

async function safeReadJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function buildOriginFromHeaders(): Promise<string | null> {
  // ✅ En Next 16 (y/o Turbopack), headers() puede ser awaitable.
  const h: any = await (headers() as any);

  const get = (k: string) => {
    try {
      return typeof h?.get === "function" ? h.get(k) : null;
    } catch {
      return null;
    }
  };

  const host = get("x-forwarded-host") || get("host") || null;
  if (!host) return null;

  const proto =
    get("x-forwarded-proto") ||
    (String(host).includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

export default async function EjecucionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const origin =
    (await buildOriginFromHeaders()) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    null;

  const gateUrl = origin
    ? `${origin}/api/dts/execution/gate?assessmentId=${assessmentId}`
    : null;

  const res = gateUrl
    ? await fetch(gateUrl, { cache: "no-store" }).catch(() => null)
    : null;

  const json = res ? await safeReadJson(res) : null;
  const gate: Gate | null = json?.ok ? (json.gate as Gate) : null;

  const canExecute = gate?.can_execute === true;

  // ✅ reabre el MISMO assessment
  const continueDiagnosticoUrl = `/diagnostico-full?assessmentId=${assessmentId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <EjecucionTabsClient assessmentId={assessmentId}>
        {!gate ? (
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
              <div className="text-lg font-semibold">
                No se pudo validar el estado de Ejecución
              </div>
              <div className="mt-1 text-sm">
                El backend no devolvió el gate (RPC). Revisa:
                <span className="ml-2 font-mono">/api/dts/execution/gate</span>
                {gateUrl ? (
                  <span className="block mt-2 text-xs text-rose-800 font-mono break-all">
                    {gateUrl}
                  </span>
                ) : (
                  <span className="block mt-2 text-xs text-rose-800">
                    No pude construir origin (headers/APP_URL).
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/resultados/${assessmentId}`}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800"
                >
                  Volver a resultados
                </Link>
              </div>
            </div>
          </div>
        ) : !canExecute ? (
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="text-xl font-semibold text-slate-900">
                Ejecución bloqueada
              </div>
              <div className="mt-2 text-slate-700">
                {gate.reason || "Diagnóstico insuficiente para ejecutar programas."}
              </div>

              <div className="mt-3 text-sm text-slate-700">
                Progreso diagnóstico:{" "}
                <span className="font-semibold">
                  {gate.complete_count}/{gate.required_count}
                </span>{" "}
                · Faltan{" "}
                <span className="font-semibold">{gate.missing_count}</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/resultados/${assessmentId}`}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800"
                >
                  Volver a resultados
                </Link>

                <Link
                  href={continueDiagnosticoUrl}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50"
                >
                  Completar diagnóstico
                </Link>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Nota: esta decisión viene de backend (RPC{" "}
                <span className="font-mono">dts_execution_gate_v1</span>). El frontend solo pinta.
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </EjecucionTabsClient>
    </div>
  );
}
