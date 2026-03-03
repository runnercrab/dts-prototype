export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";
import FloatingAvatar from "@/components/dts/FloatingAvatar";
import RoadmapSection from "@/components/dts/RoadmapSection";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GAPPLY_BLUE = "#1a90ff";

export default async function DtsRoadmapPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  if (!assessmentId || !UUID_RE.test(assessmentId)) redirect("/dts");

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      <DtsSidebar currentPhase={4} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <div className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between" style={{ borderBottom: '1.5px solid #dde3eb' }}>
          <span className="text-[14px] text-slate-500 font-medium">Gapply · <span className="text-slate-800 font-semibold">Plan de acción</span></span>
          <span className="text-[12px] font-[family-name:var(--font-space-mono)] text-slate-400">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        {/* Main content */}
        <main className="flex-1 px-5 md:px-10 py-10 md:py-12 pb-24">

          {/* Back link */}
          <Link
            href={`/dts/resultados/${assessmentId}`}
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al diagnóstico
          </Link>

          {/* Title */}
          <div className="mb-10">
            <h1 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 tracking-tight mb-3">Tu plan de acción</h1>
            <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed max-w-2xl">
              Programas priorizados por urgencia y capacidad de tu empresa. Marca las acciones completadas para hacer seguimiento.
            </p>
          </div>

          {/* Roadmap component */}
          <RoadmapSection assessmentId={assessmentId} />

          {/* Footer navigation */}
          <div className="flex items-center justify-between pt-10 mt-10" style={{ borderTop: '1.5px solid #dde3eb' }}>
            <Link
              href={`/dts/resultados/${assessmentId}`}
              className="inline-flex items-center gap-2 px-6 md:px-7 py-3.5 rounded-2xl text-slate-700 text-[15px] md:text-[16px] font-semibold hover:bg-slate-50 transition-colors"
              style={{ border: '1.5px solid #dde3eb' }}
            >
              ← Ver diagnóstico
            </Link>
            <Link
              href="/dts"
              className="text-[15px] text-slate-600 font-semibold hover:underline transition-colors"
              style={{ textDecorationColor: GAPPLY_BLUE }}
            >
              Volver al inicio
            </Link>
          </div>

          <div className="text-center mt-10 text-[13px] text-slate-400 font-medium">Gapply · Standards-as-a-Service · DTS V1</div>
        </main>
      </div>

      <FloatingAvatar />
    </div>
  );
}