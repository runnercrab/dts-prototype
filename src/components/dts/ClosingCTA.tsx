"use client";

import Link from "next/link";

const GAPPLY_BLUE = "#1a90ff";

interface Props {
  assessmentId: string;
  score: number;
}

export default function ClosingCTA({ assessmentId, score }: Props) {
  return (
    <section className="rounded-2xl p-10 md:p-14 mb-10 md:ml-[68px] text-center" style={{ backgroundColor: '#f7f9fb', border: '1.5px solid #dde3eb' }}>

      <h2 className="text-[24px] md:text-[28px] font-extrabold text-slate-900 tracking-tight mb-3">
        ¿Y ahora qué?
      </h2>

      <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed max-w-lg mx-auto mb-8">
        Ya tienes el diagnóstico. Tu plan de acción está listo con programas priorizados y acciones concretas mes a mes.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

        {/* Primary: Go to roadmap */}
        <Link
          href={`/dts/roadmap/${assessmentId}`}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white text-[16px] md:text-[17px] font-bold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: GAPPLY_BLUE }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
          Ver plan de acción
        </Link>

        {/* Secondary: Calendly */}
        <a
          href="https://calendly.com/david-gapply/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-slate-700 text-[16px] md:text-[17px] font-bold bg-white transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
          style={{ border: '1.5px solid #dde3eb' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Agendar sesión con experto
        </a>

      </div>

      <p className="text-[13px] text-slate-400 mt-6">
        El plan es tuyo. Si quieres acompañamiento personalizado, agenda una sesión gratuita.
      </p>

    </section>
  );
}