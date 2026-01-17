"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function EjecucionTabsClient({
  assessmentId,
  children,
}: {
  assessmentId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const base = `/resultados/${assessmentId}/ejecucion`;
  const hrefProgramas = `${base}/programas`;
  const hrefMatriz = `${base}/matriz`;
  const hrefRoadmap = `${base}/roadmap`;

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/resultados/${assessmentId}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Volver a resultados
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <div>
              <div className="text-base font-semibold text-slate-900">
                Ejecución
              </div>
              <div className="text-sm text-slate-500">
                Programas, matriz y roadmap (lo accionable)
              </div>
            </div>
          </div>

          <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600">
            {assessmentId.slice(0, 8)}…
          </span>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-4">
          <div className="flex items-center gap-2">
            <Link
              href={hrefProgramas}
              className={[
                "px-4 py-2 rounded-full border text-sm transition",
                isActive(pathname, hrefProgramas)
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
              ].join(" ")}
            >
              Programas
            </Link>

            <Link
              href={hrefMatriz}
              className={[
                "px-4 py-2 rounded-full border text-sm transition",
                isActive(pathname, hrefMatriz)
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
              ].join(" ")}
            >
              Matriz
            </Link>

            <Link
              href={hrefRoadmap}
              className={[
                "px-4 py-2 rounded-full border text-sm transition",
                isActive(pathname, hrefRoadmap)
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
              ].join(" ")}
            >
              Roadmap
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </>
  );
}
