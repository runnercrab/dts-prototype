"use client";
import Link from "next/link";

const GAPPLY_BLUE = "#1a90ff";

interface DtsSidebarProps {
  currentPhase: number;
  assessmentId?: string;
}

const PHASES = [
  { num: 0, label: "Inicio" },
  { num: 1, label: "Onboarding" },
  { num: 2, label: "Diagnóstico" },
  { num: 3, label: "Resultado" },
  { num: 4, label: "Programas" },
  { num: 5, label: "Ejecución" },
];

function getPhaseHref(num: number, assessmentId?: string): string | null {
  if (!assessmentId) {
    if (num === 0) return "/dts";
    return null;
  }
  switch (num) {
    case 0: return "/dts";
    case 1: return `/dts/onboarding/${assessmentId}`;
    case 2: return `/dts/diagnostico/${assessmentId}`;
    case 3: return `/dts/resultados/${assessmentId}`;
    default: return null;
  }
}

export default function DtsSidebar({ currentPhase, assessmentId }: DtsSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white border-r border-slate-200 flex flex-col z-30 hidden md:flex">
      {/* LOGO */}
      <div className="px-4 py-5 border-b border-slate-100 flex items-center justify-center">
        <Link href="/dts">
          <img src="/gapply-logo.png" alt="Gapply" className="w-[160px] h-auto" />
        </Link>
      </div>

      {/* PHASES */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {PHASES.map((phase) => {
          const isActive = phase.num === currentPhase;
          const isCompleted = phase.num < currentPhase;
          const isFuture = phase.num > currentPhase;
          const isFarFuture = phase.num >= 4;
          const href = getPhaseHref(phase.num, assessmentId);
          const isClickable = href && !isActive;

          const content = (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isActive ? '#e8f4ff' : isCompleted ? '#e8f4ff' : isFarFuture ? '#f8fafc' : '#f1f5f9',
                  border: isActive ? `2.5px solid ${GAPPLY_BLUE}` : isCompleted ? `2.5px solid ${GAPPLY_BLUE}` : isFarFuture ? '2px solid #e2e8f0' : '2px solid #cbd5e1',
                }}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" style={{ color: GAPPLY_BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-[13px] font-bold`} style={{ color: isActive ? GAPPLY_BLUE : isFarFuture ? '#cbd5e1' : '#94a3b8' }}>
                    {phase.num}
                  </span>
                )}
              </div>
              <span
                className={`text-[14px] ${
                  isActive ? "font-bold" : isCompleted ? "font-semibold" : isFarFuture ? "text-slate-300" : "text-slate-400"
                }`}
                style={isActive ? { color: GAPPLY_BLUE } : isCompleted ? { color: '#475569' } : {}}
              >
                {isActive ? "→ " : ""}{phase.label}
              </span>
            </>
          );

          const className = `flex items-center gap-3 px-3 py-3 rounded-lg mb-1.5 transition-colors ${
            isActive
              ? "bg-blue-50 border-2 border-blue-200"
              : isCompleted
              ? "bg-slate-50 hover:bg-blue-50/50 cursor-pointer"
              : ""
          }`;

          return isClickable ? (
            <Link key={phase.num} href={href} className={className}>{content}</Link>
          ) : (
            <div key={phase.num} className={className}>{content}</div>
          );
        })}
      </nav>

      {/* USER */}
      <div className="px-4 py-4 border-t border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: GAPPLY_BLUE }}>
          <span className="text-white text-[13px] font-bold">N</span>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-700">David A.</div>
          <div className="text-[11px] text-slate-400">CEO</div>
        </div>
      </div>
    </aside>
  );
}