// src/components/shell/NavigationFooter.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const FLOW_STEPS = [
  { path: "", tab: null, label: "Visión general" },
  { path: "", tab: "frenos", label: "Frenos" },
  { path: "", tab: "priorizacion", label: "Priorización" },
  { path: "/cierre", tab: null, label: "Cierre" },
  { path: "/ejecucion/programas", tab: null, label: "Programas" },
  { path: "/ejecucion/matriz", tab: null, label: "Matriz" },
  { path: "/ejecucion/roadmap", tab: null, label: "Roadmap" },
  { path: "/ejecucion/seguimiento", tab: null, label: "Seguimiento" },
];

export default function NavigationFooter({ assessmentId }: { assessmentId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const basePath = `/resultados/${assessmentId}`;

  // Find current step index - check both pathname AND tab
  const currentIndex = FLOW_STEPS.findIndex((step) => {
    const fullPath = `${basePath}${step.path}`;
    const pathMatches = pathname === fullPath || pathname === fullPath + "/";
    
    if (step.tab) {
      // Tab-based step: path must match AND tab must match
      return pathMatches && currentTab === step.tab;
    } else {
      // Route-based step: path must match AND no tab (or matching path with subpath)
      return pathMatches && !currentTab;
    }
  });

  const prevStep = currentIndex > 0 ? FLOW_STEPS[currentIndex - 1] : null;
  const nextStep = currentIndex < FLOW_STEPS.length - 1 ? FLOW_STEPS[currentIndex + 1] : null;

  // Build href for a step
  const buildHref = (step: typeof FLOW_STEPS[number]) => {
    if (step.tab) {
      return `${basePath}${step.path}?tab=${step.tab}`;
    }
    return `${basePath}${step.path}`;
  };

  // Don't render if we can't find current position
  if (currentIndex === -1) return null;

  return (
    <div className="fixed bottom-0 left-16 right-[560px] bg-white border-t border-slate-200 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Previous */}
        {prevStep ? (
          <Link
            href={buildHref(prevStep)}
            className="inline-flex items-center px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            ← Anterior
          </Link>
        ) : (
          <div />
        )}

        {/* Current step indicator */}
        <div className="text-sm text-slate-500">
          {currentIndex + 1} / {FLOW_STEPS.length}
        </div>

        {/* Next */}
        {nextStep ? (
          <Link
            href={buildHref(nextStep)}
            className="inline-flex items-center px-5 py-2.5 bg-blue-800 text-white rounded-xl font-semibold text-sm hover:bg-blue-900 transition"
          >
            Siguiente →
          </Link>
        ) : (
          <div className="px-5 py-2.5 bg-slate-200 text-slate-400 rounded-xl font-semibold text-sm cursor-not-allowed">
            Siguiente →
          </div>
        )}
      </div>
    </div>
  );
}