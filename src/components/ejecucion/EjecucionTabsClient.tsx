// src/components/ejecucion/EjecucionTabsClient.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ExecutionGate = {
  locked: boolean;
  reason?: string | null;
  // opcional: si el backend quiere guiar
  hint?: string | null;
};

export default function EjecucionTabsClient({
  assessmentId,
  gate,
  children,
}: {
  assessmentId: string;
  gate?: ExecutionGate | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const base = `/resultados/${assessmentId}/ejecucion`;

  const tabs = [
    { label: "Seguimiento", href: `${base}/seguimiento` },
    { label: "Programas", href: `${base}/programas` },
    { label: "Matriz", href: `${base}/matriz` },
    { label: "Roadmap", href: `${base}/roadmap` },
  ];

  const isLocked = Boolean(gate?.locked);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-4">
        <Link
          href={`/resultados/${assessmentId}`}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Volver a resultados
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-slate-900">Ejecución</div>
            <div className="text-sm text-slate-600">
              Seguimiento, programas, matriz y roadmap (lo accionable)
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500">
            {assessmentId.slice(0, 8)}…
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = pathname ? pathname.startsWith(t.href) : false;

            // UI-only: si está bloqueado, no “rompemos” el link,
            // pero lo mostramos atenuado para que el usuario entienda el estado.
            // La lógica real de bloqueo/redirección debe estar en layout/server.
            const disabledStyle = isLocked
              ? "opacity-60"
              : "";

            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "px-4 py-2 rounded-full text-sm font-semibold border transition",
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  disabledStyle,
                ].join(" ")}
                aria-disabled={isLocked ? "true" : "false"}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {isLocked ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-xl font-semibold text-amber-900">
            Ejecución bloqueada
          </div>
          <div className="mt-2 text-sm text-amber-900">
            {gate?.reason ||
              "Diagnóstico insuficiente para calcular un ranking real de programas. Completa más criterios para desbloquear Ejecución."}
          </div>

          {gate?.hint ? (
            <div className="mt-2 text-xs text-amber-800">{gate.hint}</div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/resultados/${assessmentId}`}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition"
            >
              Volver a resultados
            </Link>

            {/* Ruta existente en tu repo. No inventamos /login ni nada */}
            <Link
              href={`/diagnostico-full?assessmentId=${assessmentId}`}
              className="inline-flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
            >
              Completar diagnóstico
            </Link>
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
}
