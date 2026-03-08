export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";
import FloatingAvatar from "@/components/dts/FloatingAvatar";
import GapplyRoadmap from "@/components/dts/GapplyRoadmap";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GAPPLY_BLUE = "#1a90ff";

export default async function DtsRoadmapPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  if (!assessmentId || !UUID_RE.test(assessmentId)) redirect("/dts");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/dts/roadmap?assessmentId=${assessmentId}`, { cache: "no-store" });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Error desconocido" }));
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 max-w-md" style={{ border: '1.5px solid #dde3eb' }}>
          <h1 className="text-xl font-bold text-slate-900">Error</h1>
          <p className="mt-3 text-[16px] text-slate-700">{error}</p>
          <Link href="/dts" className="mt-5 inline-block text-[15px] font-semibold hover:underline" style={{ color: GAPPLY_BLUE }}>← Volver</Link>
        </div>
      </div>
    );
  }

  const data = await res.json();
  const { programs, capacity, d5, summary, companyName } = data;

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      <DtsSidebar currentPhase={4} assessmentId={assessmentId} maxPhase={4} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between" style={{ borderBottom: "1.5px solid #dde3eb" }}>
          <span className="text-[14px] text-slate-500 font-medium">Gapply · <span className="text-slate-800 font-semibold">Plan de acción</span>{companyName && <> · <span className="text-slate-800 font-semibold">{companyName}</span></>}</span>
          <span className="text-[12px] font-[family-name:var(--font-space-mono)] text-slate-400">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        <main className="flex-1 px-4 md:px-6 py-10 md:py-12 pb-24">
          <GapplyRoadmap
            assessmentId={assessmentId}
            programs={programs}
            capacity={capacity}
            d5={d5}
            capacityExceeded={summary.capacity_exceeded}
            capacityExcessHours={summary.capacity_excess_hours}
            starterActionsForced={summary.starter_actions_forced}
          />

          <div className="pt-10 mt-10" style={{ borderTop: "1.5px solid #dde3eb" }}>
            <Link href={`/dts/resultados/${assessmentId}`} className="inline-flex items-center gap-2 px-6 md:px-7 py-3.5 rounded-2xl text-slate-700 text-[15px] md:text-[16px] font-semibold hover:bg-slate-50 transition-colors" style={{ border: "1.5px solid #dde3eb" }}>
              ← Ver diagnóstico
            </Link>
          </div>

          <div className="text-center mt-10 text-[13px] text-slate-400 font-medium">Gapply</div>
        </main>
      </div>

      <FloatingAvatar />
    </div>
  );
}