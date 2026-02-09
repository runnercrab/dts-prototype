export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DtsSidebar from "@/components/dts/DtsSidebar";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchDtsV1(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing env vars");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("dts_v1_results", { p_assessment_id: id });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Empty payload");
  return data;
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 54, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return (
    <div className="relative w-[160px] h-[160px] shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="#0283f8" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[44px] font-bold leading-none text-slate-900">{pct}</span>
        <span className="text-base text-slate-400">/100</span>
      </div>
    </div>
  );
}

const DIM_ICON: Record<string, string> = {
  EST: "📊", DAT: "📈", TEC: "💻", OPE: "⚙️", PER: "👥", GOB: "🏛️",
};

export default async function DtsResultadosPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  if (!assessmentId || !UUID_RE.test(assessmentId)) redirect("/dts");

  let data: any;
  try { data = await fetchDtsV1(assessmentId); } catch (e: any) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md">
          <h1 className="text-lg font-semibold text-slate-900">Error</h1>
          <p className="mt-2 text-sm text-slate-600">{e?.message}</p>
          <Link href="/dts" className="mt-4 inline-block text-sm text-blue-500 hover:text-blue-600">← Volver</Link>
        </div>
      </div>
    );
  }

  const { scores, frenos, resumen } = data;
  const g = scores.global;
  const foto = resumen.foto_general;
  const pp = resumen.primer_paso;

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ═══ SHARED SIDEBAR ═══ */}
      <DtsSidebar currentPhase={3} />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="ml-[220px] flex-1 px-10 py-10 pb-24">

        {/* Section nav */}
        <div className="flex items-center gap-4 mb-8">
          <a href="#score" className="text-[13px] text-slate-500 hover:text-blue-600 transition-colors">Score</a>
          <span className="text-slate-300">·</span>
          <a href="#frenos" className="text-[13px] text-slate-500 hover:text-blue-600 transition-colors">Frenos</a>
          <span className="text-slate-300">·</span>
          <a href="#dimensiones" className="text-[13px] text-slate-500 hover:text-blue-600 transition-colors">Dimensiones</a>
          <span className="text-slate-300">·</span>
          <a href="#detalle" className="text-[13px] text-slate-500 hover:text-blue-600 transition-colors">Detalle</a>
          <span className="ml-auto text-[12px] font-mono text-slate-300">{assessmentId.slice(0, 8)}</span>
        </div>

        {/* BLOCK 1: SCORE HERO */}
        <section id="score" className="bg-white rounded-2xl p-10 mb-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
            <ScoreRing pct={g.score_0_100} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Tu Madurez Digital</div>
              <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-3">{foto.titulo_es}</h1>
              <p className="text-[16px] text-slate-600 leading-relaxed">{foto.mensaje_es}</p>
            </div>
          </div>

          {/* Dimensions row */}
          <div id="dimensiones" className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-8 pt-6 border-t border-slate-200">
            {scores.by_dimension.map((d: any) => {
              const sc = d.score_1_5 ?? 0;
              const isLow = sc < 2;
              return (
                <div key={d.dimension_code} className={`flex flex-col items-center py-3 px-2 rounded-xl text-center ${isLow ? "bg-red-50" : "bg-slate-50"}`}>
                  <span className="text-xl mb-1">{DIM_ICON[d.dimension_code] || "📋"}</span>
                  <span className="text-[11px] text-slate-500 mb-1 leading-tight">{d.dimension_name_es}</span>
                  <span className={`text-[18px] font-bold ${isLow ? "text-red-500" : "text-slate-800"}`}>{sc.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* BLOCK 2: PRIMER PASO */}
        {pp && (
          <section className="bg-white rounded-2xl p-7 mb-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-widest text-blue-500 font-semibold mb-1">Tu primer paso</div>
                <div className="text-[16px] font-semibold text-slate-800">{pp.titulo_es}</div>
                <div className="text-[13px] text-slate-400 mt-1">{pp.freno_ref?.dimension_code} · {pp.freno_ref?.freno_type_code}</div>
              </div>
            </div>
          </section>
        )}

        {/* BLOCK 3: FRENOS */}
        {frenos.length > 0 && (
          <section id="frenos" className="bg-white rounded-2xl p-8 mb-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
            <div className="mb-6">
              <h2 className="text-[18px] font-bold text-slate-800">Lo que te está frenando</h2>
              <p className="text-[13px] text-slate-500 mt-1">{frenos.length} obstáculo{frenos.length > 1 ? "s" : ""} principal{frenos.length > 1 ? "es" : ""} detectado{frenos.length > 1 ? "s" : ""}</p>
            </div>
            <div className="flex flex-col gap-4">
              {frenos.map((f: any) => {
                const m = f.message;
                const isCritico = f.freno_type_code === "CRITICO";
                const isEstructural = f.freno_type_code === "ESTRUCTURAL";
                const borderColor = isCritico ? "border-l-red-500" : isEstructural ? "border-l-amber-500" : "border-l-slate-300";
                return (
                  <div key={`${f.freno_type_code}-${f.rank}`}
                    className={`border border-slate-200 border-l-4 ${borderColor} rounded-2xl p-6 hover:shadow-sm transition-shadow`}>
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        isCritico ? "bg-red-100 text-red-500" : isEstructural ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                      }`}>{f.rank}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[15px] font-semibold text-slate-800">{m.headline_es}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            isCritico ? "bg-red-50 text-red-500" : isEstructural ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-400"
                          }`}>{f.freno_type_code}</span>
                        </div>
                        <p className="text-[14px] text-slate-600 leading-relaxed">{m.body_es}</p>
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-[11px] font-medium text-slate-400 mb-1">Impacto en tu negocio</div>
                            <div className="text-[13px] text-slate-700">{m.impacto_es}</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-[11px] font-medium text-blue-400 mb-1">Acción recomendada</div>
                            <div className="text-[13px] text-slate-700">{m.cta_es}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-300 font-mono">
                          {f.dimension_code} · {f.dimension_name_es} · {m.evidence_label_es}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* BLOCK 4: CRITERIA TABLE */}
        <section id="detalle" className="bg-white rounded-2xl overflow-hidden mb-6" style={{boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="text-[18px] font-bold text-slate-800">Detalle por criterio</h3>
            <p className="text-[13px] text-slate-500 mt-1">{scores.by_criteria.length} criterios evaluados · nivel as-is (1-5)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-8 font-medium">Criterio</th>
                  <th className="py-3 px-4 font-medium">Dimensión</th>
                  <th className="py-3 px-4 font-medium text-center">Nivel</th>
                  <th className="py-3 px-4 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {scores.by_criteria.map((c: any) => (
                  <tr key={c.criteria_code} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-3 px-8">
                      <span className="font-mono text-[13px] text-slate-700">{c.criteria_code}</span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-slate-500">{c.dimension_code}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-[13px] font-bold ${
                        c.as_is_level <= 1 ? "bg-red-50 text-red-500"
                        : c.as_is_level <= 2 ? "bg-amber-50 text-amber-500"
                        : c.as_is_level <= 3 ? "bg-blue-50 text-blue-500"
                        : "bg-emerald-50 text-emerald-500"
                      }`}>{c.as_is_level}</span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-slate-500 max-w-[280px] truncate">{c.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BLOCK 5: NAVIGATION */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href={`/dts/diagnostico/${assessmentId}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-300 text-blue-600 text-[15px] font-semibold hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            ← Revisar diagnóstico
          </Link>
          <Link
            href="/dts"
            className="text-[14px] text-slate-500 hover:text-blue-600 hover:underline transition-colors"
          >
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mt-8 text-[12px] text-slate-300">Gapply · Standards-as-a-Service · DTS V1</div>
      </main>

      {/* ═══ FLOATING AVATAR BUTTON ═══ */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="w-[60px] h-[60px] rounded-full bg-blue-500 flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
        </button>
      </div>
    </div>
  );
}