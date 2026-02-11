"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const GAPPLY_BLUE = "#1a90ff";

const PHASES = [
  { n: 0, label: "Inicio",       path: "/dts" },
  { n: 1, label: "Onboarding",   path: "/dts/onboarding" },
  { n: 2, label: "Diagnóstico",  path: "/dts/diagnostico" },
  { n: 3, label: "Resultados",   path: "/dts/resultados" },
];

interface Props {
  currentPhase: number;
  assessmentId?: string;
}

export default function DtsSidebar({ currentPhase, assessmentId }: Props) {
  const pathname = usePathname();

  function getHref(phase: typeof PHASES[number]) {
    if (phase.n === 0) return "/dts";
    if (!assessmentId) return "#";
    return `${phase.path}/${assessmentId}`;
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[220px] bg-white z-40" style={{ borderRight: '1.5px solid #dde3eb' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-center" style={{ borderBottom: '1.5px solid #dde3eb' }}>
          <Image src="/gapply-logo.png" alt="Gapply" width={120} height={40} className="object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-3 font-[family-name:var(--font-space-mono)]">
            Fases
          </div>
          <div className="space-y-1">
            {PHASES.map((phase) => {
              const isActive = phase.n === currentPhase;
              const isPast = phase.n < currentPhase;
              const isFuture = phase.n > currentPhase;
              const href = getHref(phase);
              const isDisabled = isFuture || (!assessmentId && phase.n > 0);

              return (
                <Link
                  key={phase.n}
                  href={isDisabled ? "#" : href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    isActive
                      ? "bg-[#e8f4ff] text-slate-900 font-semibold"
                      : isPast
                        ? "text-slate-700 hover:bg-slate-50"
                        : "text-slate-400 cursor-not-allowed"
                  }`}
                  style={isActive ? { border: `1.5px solid ${GAPPLY_BLUE}40` } : {}}
                  onClick={(e) => isDisabled && e.preventDefault()}
                >
                  {/* Step indicator */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${
                      isActive
                        ? "text-white"
                        : isPast
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                    style={isActive ? { backgroundColor: GAPPLY_BLUE } : {}}
                  >
                    {isPast ? "✓" : phase.n + 1}
                  </div>
                  {phase.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: '1.5px solid #dde3eb' }}>
          <div className="text-[12px] text-slate-400 font-medium font-[family-name:var(--font-space-mono)]">
            CEO30 · v1.0
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR (inside header, handled by pages) ── */}
      {/* Mobile navigation is handled via the dimension progress bar */}
    </>
  );
}