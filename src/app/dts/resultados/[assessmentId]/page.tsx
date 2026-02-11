export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DtsSidebar from "@/components/dts/DtsSidebar";
import ClosingCTA from "@/components/dts/ClosingCTA";
import FloatingAvatar from "@/components/dts/FloatingAvatar";

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

const GAPPLY_BLUE = "#1a90ff";

function getBand(score_1_5: number) {
  if (score_1_5 < 2) return { color: "#ef4444", label: "En riesgo",   pillBg: "#fee2e2", pillText: "#dc2626", ring: "#ef4444" };
  if (score_1_5 < 3) return { color: "#f59e0b", label: "Frágil",      pillBg: "#fef3c7", pillText: "#d97706", ring: "#f59e0b" };
  if (score_1_5 < 4) return { color: "#3b82f6", label: "En progreso", pillBg: "#dbeafe", pillText: "#2563eb", ring: "#3b82f6" };
  return                     { color: "#10b981", label: "Sólido",      pillBg: "#d1fae5", pillText: "#059669", ring: "#10b981" };
}

function humanLevel(level: number): string {
  if (level <= 1) return "Sin madurez";
  if (level <= 2) return "Nivel básico";
  if (level <= 3) return "En desarrollo";
  if (level <= 4) return "Avanzado";
  return "Optimizado";
}

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 54, circ = 2 * Math.PI * r;
  const visualPct = Math.max(pct, 8);
  const offset = circ - (visualPct / 100) * circ;
  return (
    <div className="relative w-[180px] h-[180px] shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[52px] font-bold leading-none text-slate-900">{pct}</span>
        <span className="text-[16px] text-slate-400 font-medium">/100</span>
      </div>
    </div>
  );
}

function StepCircle({ n }: { n: number }) {
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2" style={{ borderColor: GAPPLY_BLUE, backgroundColor: '#f0f7ff' }}>
      <span className="text-[16px] font-bold" style={{ color: GAPPLY_BLUE }}>{n}</span>
    </div>
  );
}

function StepRail({ n, showLine = true }: { n: number; showLine?: boolean }) {
  return (
    <div className="hidden md:flex flex-col items-center shrink-0" style={{ width: 48 }}>
      <StepCircle n={n} />
      {showLine && (
        <>
          <div className="flex-1 w-[3px] rounded-full mt-1" style={{ backgroundColor: '#c5ddf8' }} />
          <div className="w-0 h-0 shrink-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #c5ddf8' }} />
        </>
      )}
    </div>
  );
}

function MobileStepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex md:hidden items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2" style={{ borderColor: GAPPLY_BLUE, backgroundColor: '#f0f7ff' }}>
        <span className="text-[14px] font-bold" style={{ color: GAPPLY_BLUE }}>{n}</span>
      </div>
      <h2 className="text-[22px] font-bold text-slate-800">{title}</h2>
    </div>
  );
}

const DIM_ICON: Record<string, string> = {
  EST: "/icons/target.png",
  OPE: "/icons/gears.png",
  PER: "/icons/users.png",
  DAT: "/icons/database.png",
  TEC: "/icons/chip.png",
  GOB: "/icons/handshake.png",
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
  const band = getBand(g.score_1_5);

  const sortedDims = [...scores.by_dimension].sort((a: any, b: any) => (a.score_1_5 ?? 0) - (b.score_1_5 ?? 0));

  const dimScores = sortedDims.map((d: any) => d.score_1_5 ?? 0);
  const dimMin = Math.min(...dimScores);
  const dimMax = Math.max(...dimScores);
  const isLowVariance = (dimMax - dimMin) < 1;

  const criteriaByDim: Record<string, { name: string; items: any[]; avgLevel: number }> = {};
  for (const c of scores.by_criteria) {
    const code = c.dimension_code;
    if (!criteriaByDim[code]) {
      const dim = scores.by_dimension.find((d: any) => d.dimension_code === code);
      criteriaByDim[code] = { name: dim?.dimension_name_es || code, items: [], avgLevel: 0 };
    }
    criteriaByDim[code].items.push(c);
  }
  for (const code of Object.keys(criteriaByDim)) {
    const items = criteriaByDim[code].items;
    criteriaByDim[code].avgLevel = items.reduce((s: number, i: any) => s + (i.as_is_level || 1), 0) / items.length;
  }
  const dimGroups = Object.entries(criteriaByDim).sort(([, a], [, b]) => a.avgLevel - b.avgLevel);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DtsSidebar currentPhase={3} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <div className="bg-white px-6 md:px-8 py-3 flex items-center justify-between">
          <span className="text-[13px] text-slate-400">Gapply · Resultado</span>
          <span className="text-[12px] font-mono text-slate-300">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        <main className="flex-1 px-5 md:px-10 py-8 md:py-10 pb-24">

          <div className="flex items-center gap-4 md:gap-6 mb-8 overflow-x-auto">
            <a href="#step1" className="text-[14px] md:text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Score</a>
            <span className="text-slate-300">·</span>
            <a href="#step2" className="text-[14px] md:text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Dimensiones</a>
            <span className="text-slate-300">·</span>
            <a href="#step3" className="text-[14px] md:text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Acción</a>
            <span className="text-slate-300">·</span>
            <a href="#obstaculos" className="text-[14px] md:text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Obstáculos</a>
            <span className="text-slate-300">·</span>
            <a href="#respuestas" className="text-[14px] md:text-[15px] font-semibold text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">Respuestas</a>
          </div>

          {/* STEP 1 */}
          <div id="step1" className="flex gap-0">
            <StepRail n={1} />
            <div className="flex-1 md:pl-5 pt-0 md:pt-2 pb-6 min-w-0">
              <MobileStepHeader n={1} title="¿Cómo estás?" />
              <h2 className="hidden md:block text-[26px] font-bold text-slate-800 mb-4">¿Cómo estás?</h2>
              <section className="bg-white rounded-2xl p-6 md:p-10 border-2" style={{ borderColor: band.color }}>
                <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-10">
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <ScoreRing pct={g.score_0_100} color={band.ring} />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ backgroundColor: band.pillBg }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: band.color }} />
                      <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: band.pillText }}>{band.label}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-center lg:text-left">
                    <h1 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-tight mb-4">{foto.titulo_es}</h1>
                    <p className="text-[16px] md:text-[17px] text-slate-600 leading-relaxed">{foto.mensaje_es}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* STEP 2 */}
          <div id="step2" className="flex gap-0">
            <StepRail n={2} />
            <div className="flex-1 md:pl-5 pt-0 md:pt-2 pb-6 min-w-0">
              <MobileStepHeader n={2} title="¿Dónde está el problema?" />
              <h2 className="hidden md:block text-[26px] font-bold text-slate-800 mb-4">¿Dónde está el problema?</h2>
              {isLowVariance && (
                <div className="mb-4 px-5 py-3 rounded-xl bg-slate-100 text-[14px] text-slate-600">
                  {dimMax < 2 ? "Todas tus dimensiones están por debajo del nivel básico. El problema no es un área concreta — es la base digital entera."
                    : dimMax < 3 ? "Tus dimensiones están en un nivel similar. Tienes una base uniforme pero con margen de mejora en todas."
                    : "Tus dimensiones están bastante equilibradas. Buen punto de partida."}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDims.map((d: any, i: number) => {
                  const sc = d.score_1_5 ?? 0;
                  const iconSrc = DIM_ICON[d.dimension_code] || "/icons/target.png";
                  const isWorst = i === 0;
                  return (
                    <div key={d.dimension_code} className={`bg-white border rounded-2xl p-6 flex items-center gap-5 transition-shadow hover:shadow-md relative ${isWorst ? "border-slate-300 shadow-sm" : "border-slate-200"}`}>
                      {isWorst && (
                        <div className="absolute -top-2.5 right-4 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: GAPPLY_BLUE }}>Más crítica</div>
                      )}
                      <Image src={iconSrc} alt={d.dimension_name_es} width={44} height={44} className="flex-shrink-0 opacity-60" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-slate-700 truncate">{d.dimension_name_es}</div>
                        <div className="text-[28px] font-bold leading-tight text-slate-900">{sc.toFixed(1)}</div>
                      </div>
                      <div className="text-[13px] font-medium text-slate-300">/5</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div id="step3" className="flex gap-0">
            <StepRail n={3} showLine={false} />
            <div className="flex-1 md:pl-5 pt-0 md:pt-2 pb-8 min-w-0">
              <MobileStepHeader n={3} title="¿Qué hago primero?" />
              <h2 className="hidden md:block text-[26px] font-bold text-slate-800 mb-4">¿Qué hago primero?</h2>
              {pp && (
                <section className="rounded-2xl p-6 md:p-10 border-2 bg-white" style={{ borderColor: GAPPLY_BLUE }}>
                  <div className="flex items-start gap-5 md:gap-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#e8f4ff' }}>
                      <svg className="w-7 h-7 md:w-8 md:h-8" style={{ color: GAPPLY_BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] md:text-[14px] uppercase tracking-widest font-semibold mb-3" style={{ color: GAPPLY_BLUE }}>Tu primer movimiento</div>
                      <div className="text-[22px] md:text-[26px] font-bold leading-snug mb-3 text-slate-900">{pp.titulo_es}</div>
                      <div className="text-[16px] md:text-[17px] text-slate-600 leading-relaxed">Hemos analizado tus respuestas y este es el punto que más te limita ahora mismo. Abajo tienes el detalle de todos los obstáculos.</div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* OBSTÁCULOS */}
          {frenos.length > 0 && (
            <section id="obstaculos" className="bg-white rounded-2xl p-6 md:p-10 mb-8 border border-slate-200 mt-4 md:ml-[68px]">
              <div className="mb-8">
                <h3 className="text-[20px] font-bold text-slate-700">{frenos.length} obstáculo{frenos.length > 1 ? "s" : ""} principal{frenos.length > 1 ? "es" : ""} detectado{frenos.length > 1 ? "s" : ""}</h3>
              </div>
              <div className="flex flex-col gap-6">
                {frenos.map((f: any) => {
                  const m = f.message;
                  const isCritico = f.freno_type_code === "CRITICO";
                  const isEstructural = f.freno_type_code === "ESTRUCTURAL";
                  const typeLabel = isCritico ? "Crítico" : isEstructural ? "Estructural" : "Transversal";
                  const evidenceLevel = m.evidence_label_es?.match(/nivel\s*(\d)/i);
                  const levelNum = evidenceLevel ? parseInt(evidenceLevel[1]) : 1;
                  const humanEvidence = `${f.dimension_name_es} · ${humanLevel(levelNum)}`;

                  return (
                    <div key={`${f.freno_type_code}-${f.rank}`} className="border border-slate-200 rounded-2xl p-6 md:p-8 hover:shadow-md hover:border-slate-300 transition-all">
                      <div className="flex gap-4 md:gap-5">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[18px] font-bold text-red-600 bg-red-50 border-2 border-red-400">{f.rank}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="text-[18px] md:text-[19px] font-bold text-slate-800">{m.headline_es}</span>
                            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500">{typeLabel}</span>
                          </div>
                          <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed mb-6">{m.body_es}</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-5">
                              <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Impacto</div>
                              <div className="text-[15px] text-slate-700 leading-relaxed">{m.impacto_es}</div>
                            </div>
                            <div className="rounded-xl p-5" style={{ backgroundColor: '#f0f7ff' }}>
                              <div className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: GAPPLY_BLUE }}>Acción recomendada</div>
                              <div className="text-[15px] text-slate-700 leading-relaxed">{m.cta_es}</div>
                            </div>
                          </div>
                          <div className="mt-5 text-[13px] font-medium" style={{ color: GAPPLY_BLUE }}>{humanEvidence}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* RESPUESTAS */}
          <section id="respuestas" className="bg-white rounded-2xl overflow-hidden mb-8 border border-slate-200 md:ml-[68px]">
            <div className="px-6 md:px-8 py-7 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-[20px] font-bold text-slate-700">Tus respuestas</h3>
                  <p className="text-[14px] text-slate-500 mt-1">{scores.by_criteria.length} preguntas en {dimGroups.length} dimensiones</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Nivel:</span>
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <div key={lvl} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GAPPLY_BLUE, opacity: 0.25 + (lvl / 5) * 0.75 }} />
                      <span>{lvl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {dimGroups.map(([code, group]) => {
                const avg = group.avgLevel;
                const levelCounts: Record<number, number> = {};
                for (const item of group.items) {
                  const lvl = item.as_is_level || 1;
                  levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
                }
                return (
                  <div key={code} className="px-6 md:px-8 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl text-[15px] font-bold text-white" style={{ backgroundColor: GAPPLY_BLUE, opacity: Math.max(0.4, avg / 5) }}>{avg.toFixed(1)}</span>
                        <div>
                          <div className="text-[15px] md:text-[16px] font-semibold text-slate-800">{group.name}</div>
                          <div className="text-[13px] text-slate-400">{group.items.length} preguntas · {humanLevel(Math.round(avg))}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3, 4, 5].map(lvl => {
                          const count = levelCounts[lvl] || 0;
                          if (count === 0) return null;
                          const opacity = 0.25 + (lvl / 5) * 0.75;
                          return (
                            <div key={lvl} className="flex items-center gap-1">
                              <div className="h-6 rounded" style={{ width: `${count * 12}px`, backgroundColor: GAPPLY_BLUE, opacity }} />
                              <span className="text-[11px] text-slate-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <ClosingCTA assessmentId={assessmentId} score={g.score_0_100} />

          <div className="flex items-center justify-between pt-4 md:ml-[68px]">
            <Link href={`/dts/diagnostico/${assessmentId}`} className="inline-flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-[14px] md:text-[15px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors">← Revisar diagnóstico</Link>
            <Link href="/dts" className="text-[14px] text-slate-500 hover:text-blue-600 hover:underline transition-colors">Volver al inicio</Link>
          </div>

          <div className="text-center mt-8 text-[12px] text-slate-300">Gapply · Standards-as-a-Service · DTS V1</div>
        </main>
      </div>

      <FloatingAvatar />
    </div>
  );
}