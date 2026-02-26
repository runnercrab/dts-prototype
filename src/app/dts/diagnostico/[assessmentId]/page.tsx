"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import DtsSidebar from "@/components/dts/DtsSidebar";
import FloatingAvatar from "@/components/dts/FloatingAvatar";

const GAPPLY_BLUE = "#1a90ff";

interface Question {
  criteria_id: string;
  criteria_code: string;
  dimension_code: string;
  dimension_name: string;
  question: string;
  context: string | null;
  display_order: number;
  levels: string[];
  response: { as_is_level: number | null; notes: string } | null;
}

interface DimInfo {
  code: string;
  name: string;
  icon: string;
  total: number;
  answered: number;
  startIndex: number;
  context: string;
}

const DIM_ICON: Record<string, string> = {
  EST: "/icons/target.png",
  OPE: "/icons/gears.png",
  PER: "/icons/users.png",
  DAT: "/icons/database.png",
  TEC: "/icons/chip.png",
  GOB: "/icons/handshake.png",
};

function dimCode(criteriaCode: string): string {
  const letter = criteriaCode.split(".")[1]?.[0] || "";
  const map: Record<string, string> = { E: "EST", O: "OPE", P: "PER", D: "DAT", T: "TEC", G: "GOB" };
  return map[letter] || letter;
}

export default function DiagnosticoPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asIsLevel, setAsIsLevel] = useState<number | null>(null);
  const [showDimIntro, setShowDimIntro] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  /* ── helpers ── */
  const isNotApplicable = (q: Question | undefined) =>
    q?.response?.as_is_notes === "NO_APLICA" || (q?.response && q.response.as_is_level === null);

  const isAnswered = (q: Question | undefined) => !!q?.response;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dts/list-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId }),
        });
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
          const firstUnanswered = data.questions.findIndex((q: Question) => !q.response);
          const idx = firstUnanswered >= 0 ? firstUnanswered : 0;
          setCurrentIndex(idx);
          setAsIsLevel(data.questions[idx]?.response?.as_is_level || null);
          const isFirstOfDim =
            idx === 0 ||
            dimCode(data.questions[idx].criteria_code) !==
              dimCode(data.questions[idx - 1]?.criteria_code || "");
          setShowDimIntro(isFirstOfDim && !data.questions[idx]?.response);

          const allAnswered = data.questions.every((q: Question) => q.response);
          if (allAnswered && data.questions.length > 0) {
            setCurrentIndex(0);
            setAsIsLevel(data.questions[0]?.response?.as_is_level || null);
            setShowDimIntro(false);
            setShowCompletion(false);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [assessmentId]);

  const saveResponse = useCallback(
    async (level?: number) => {
      const lvl = level || asIsLevel;
      if (!lvl || !questions[currentIndex]) return;
      setSaving(true);
      try {
        await fetch("/api/dts/save-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId, criteriaCode: questions[currentIndex].criteria_code, asIsLevel: lvl }),
        });
        setQuestions((prev) => prev.map((q, i) => i === currentIndex ? { ...q, response: { as_is_level: lvl, notes: "" } } : q));
      } catch (e) { console.error(e); }
      setSaving(false);
    },
    [asIsLevel, currentIndex, questions, assessmentId]
  );

  async function handleSelect(level: number) {
    setAsIsLevel(level);
    setSaving(true);
    try {
      await fetch("/api/dts/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, criteriaCode: questions[currentIndex].criteria_code, asIsLevel: level }),
      });
      setQuestions((prev) => prev.map((q, i) => i === currentIndex ? { ...q, response: { as_is_level: level, notes: "" } } : q));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 800);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  /* ══════════════════════════════════════════
     D2 — "No aplica a mi empresa"
     ══════════════════════════════════════════ */
  async function handleNotApplicable() {
    if (!questions[currentIndex]) return;
    setSaving(true);
    try {
      await fetch("/api/dts/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          criteriaCode: questions[currentIndex].criteria_code,
          asIsLevel: null,
        }),
      });
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === currentIndex
            ? { ...q, response: { as_is_level: null, notes: "NO_APLICA" } }
            : q
        )
      );
      setAsIsLevel(null);
      setSavedFlash(true);
      setTimeout(() => {
        setSavedFlash(false);
        handleNext();
      }, 400);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  function undoNotApplicable() {
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentIndex ? { ...q, response: null } : q))
    );
    setAsIsLevel(null);
  }

  async function goTo(index: number) {
    if (asIsLevel) await saveResponse();
    setCurrentIndex(index);
    setAsIsLevel(questions[index]?.response?.as_is_level || null);
    setShowDimIntro(false);
    setShowCompletion(false);
  }

  async function handlePrev() {
    if (currentIndex > 0) await goTo(currentIndex - 1);
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      const isNewDim = dimCode(questions[nextIdx].criteria_code) !== dimCode(questions[currentIndex].criteria_code);
      setCurrentIndex(nextIdx);
      setAsIsLevel(questions[nextIdx]?.response?.as_is_level || null);
      setShowDimIntro(isNewDim);
    } else {
      setShowCompletion(true);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  const current = questions[currentIndex];
  const currentDim = current ? dimCode(current.criteria_code) : "";

  const dimensions: DimInfo[] = [];
  const dimMap = new Map<string, DimInfo>();
  questions.forEach((q, i) => {
    const dc = dimCode(q.criteria_code);
    if (!dimMap.has(dc)) {
      const dim: DimInfo = { code: dc, name: q.dimension_name, icon: DIM_ICON[dc] || "/icons/target.png", context: q.context || "", total: 0, answered: 0, startIndex: i };
      dimMap.set(dc, dim);
      dimensions.push(dim);
    }
    const d = dimMap.get(dc)!;
    d.total++;
    if (q.response) d.answered++;
  });

  const totalAnswered = questions.filter((q) => q.response).length;
  const currentDimInfo = dimMap.get(currentDim);
  const questionInDim = currentDimInfo ? currentIndex - currentDimInfo.startIndex + 1 : 1;
  const dimTotal = currentDimInfo?.total || 5;

  /* ── can advance? nivel seleccionado O respuesta guardada (incluye no-aplica) ── */
  const canAdvance = !!asIsLevel || isAnswered(current);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="text-slate-600 text-lg font-medium">Cargando diagnóstico...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      <DtsSidebar currentPhase={2} assessmentId={assessmentId} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen overflow-x-hidden">

        <div className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between" style={{ borderBottom: '1.5px solid #dde3eb' }}>
          <span className="text-[14px] text-slate-500 font-medium">Gapply · <span className="text-slate-800 font-semibold">Diagnóstico</span></span>
          <span className="text-[12px] font-[family-name:var(--font-space-mono)] text-slate-400">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        {/* DIMENSION PROGRESS BAR */}
        <div className="bg-white px-4 md:px-8 py-5 md:py-6" style={{ borderBottom: '1.5px solid #dde3eb' }}>
          <div className="flex items-center justify-between gap-2 md:gap-3 overflow-x-auto">
            {dimensions.map((dim, idx) => {
              const isActive = dim.code === currentDim && !showCompletion;
              const isComplete = dim.answered === dim.total;
              return (
                <div key={dim.code} className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => goTo(dim.startIndex)}
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 md:py-3.5 rounded-2xl transition-all flex-1 min-w-0 ${isActive ? "bg-[#e8f4ff] shadow-sm" : isComplete ? "bg-blue-50 hover:bg-blue-100" : "bg-[#f7f9fb] hover:bg-slate-100"}`}
                    style={isActive ? { outline: `2px solid ${GAPPLY_BLUE}`, outlineOffset: '-2px' } : isComplete ? { outline: `2px solid ${GAPPLY_BLUE}`, outlineOffset: '-2px' } : {}}
                  >
                    {isComplete ? (
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white" style={{ border: `2.5px solid ${GAPPLY_BLUE}` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GAPPLY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                    ) : (
                      <Image src={dim.icon} alt={dim.name} width={26} height={26} className={`flex-shrink-0 ${isActive ? "opacity-100" : "opacity-40"}`} />
                    )}
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <div className={`text-[14px] md:text-[15px] font-semibold truncate ${isActive ? "text-slate-900" : isComplete ? "text-blue-700" : "text-slate-500"}`}>{dim.name}</div>
                      <div className={`text-[12px] md:text-[13px] font-bold font-[family-name:var(--font-space-mono)] ${isActive ? "text-slate-600" : isComplete ? "text-blue-500" : "text-slate-400"}`}>{dim.answered}/{dim.total}</div>
                    </div>
                    <span className="sm:hidden text-[13px] font-bold text-slate-500">{dim.answered}/{dim.total}</span>
                  </button>
                  {idx < dimensions.length - 1 && (
                    <div className={`w-4 md:w-6 h-[3px] rounded-full flex-shrink-0 ${isComplete ? "bg-blue-300" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex items-start justify-center px-5 md:px-10 py-10 md:py-14">
          <div className="w-full max-w-4xl">

            {showCompletion ? (
              <div className="flex flex-col items-center justify-center text-center py-20 md:py-24">
                <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center mb-10">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h1 className="text-[32px] md:text-[40px] font-extrabold text-slate-900 mb-5 tracking-tight">Diagnóstico completado</h1>
                <p className="text-[17px] md:text-[19px] text-slate-700 mb-4 max-w-lg leading-relaxed">Has evaluado las {questions.length} áreas clave de tu empresa.</p>
                <p className="text-[16px] md:text-[17px] text-slate-600 mb-14 max-w-md">Tu informe incluye tu nivel de madurez digital, los obstáculos que te están frenando y el primer paso concreto para avanzar.</p>
                <button onClick={() => router.push(`/dts/resultados/${assessmentId}`)} className="px-12 py-4 rounded-2xl text-white text-[18px] font-bold shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: GAPPLY_BLUE }}>Ver mis resultados →</button>
              </div>

            ) : showDimIntro && currentDimInfo ? (
              <div className="flex flex-col items-center justify-center text-center py-20 md:py-24">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl flex items-center justify-center mb-10 bg-slate-100 shadow-lg">
                  <Image src={currentDimInfo.icon} alt={currentDimInfo.name} width={60} height={60} className="md:w-[68px] md:h-[68px]" />
                </div>
                <div className="text-[15px] md:text-[17px] font-extrabold uppercase tracking-[0.15em] mb-5 font-[family-name:var(--font-space-mono)]" style={{ color: GAPPLY_BLUE }}>{currentDimInfo.name}</div>
                <h1 className="text-[26px] md:text-[34px] font-extrabold text-slate-900 leading-snug mb-6 max-w-xl px-2 tracking-tight">{currentDimInfo.context}</h1>
                <p className="text-[16px] md:text-[19px] text-slate-700 mb-14 max-w-md leading-relaxed px-2">5 preguntas · Elige la opción que mejor describe tu situación <strong>HOY</strong></p>
                <button onClick={() => setShowDimIntro(false)} className="px-12 py-4 rounded-2xl text-white text-[18px] font-bold shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: GAPPLY_BLUE }}>Empezar →</button>
              </div>

            ) : current ? (
              <div>
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[14px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 font-[family-name:var(--font-space-mono)]">
                      <Image src={DIM_ICON[currentDim] || "/icons/target.png"} alt="" width={24} height={24} className="opacity-60" />
                      {current.dimension_name}
                    </span>
                    <span className="text-[16px] md:text-[18px] text-slate-800 font-semibold">Pregunta {questionInDim} de {dimTotal}</span>
                    {savedFlash && (
                      <span className="inline-flex items-center gap-1.5 text-[15px] text-emerald-600 font-semibold animate-pulse">
                        <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Guardado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: dimTotal }).map((_, i) => (
                      <div key={i} className="h-[6px] flex-1 rounded-full transition-all duration-500" style={{ backgroundColor: i < questionInDim - 1 ? GAPPLY_BLUE : i === questionInDim - 1 ? (canAdvance ? GAPPLY_BLUE : GAPPLY_BLUE + "40") : "#dde3eb" }} />
                    ))}
                  </div>
                </div>

                <h1 className="text-[24px] md:text-[30px] font-extrabold text-slate-900 leading-snug mb-10 tracking-tight">{current.question}</h1>

                {/* ═══ D2: Indicador "ya marcada como no aplica" ═══ */}
                {isNotApplicable(current) && (
                  <div className="flex items-center gap-3 mb-8 px-6 py-5 rounded-2xl bg-slate-50" style={{ border: '1.5px solid #dde3eb' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span className="text-[16px] text-slate-500 font-medium">Marcada como &quot;no aplica a mi empresa&quot;</span>
                    <button
                      onClick={undoNotApplicable}
                      className="ml-auto text-[15px] font-semibold hover:underline"
                      style={{ color: GAPPLY_BLUE }}
                    >
                      Cambiar respuesta
                    </button>
                  </div>
                )}

                {/* ═══ Opciones de nivel (solo si NO está marcada como no-aplica) ═══ */}
                {!isNotApplicable(current) && (
                  <>
                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-5 font-[family-name:var(--font-space-mono)]">Opciones</p>

                    <div className="space-y-3.5 mb-4">
                      {current.levels.map((level, i) =>
                        level ? (
                          <button key={i} onClick={() => handleSelect(i + 1)} disabled={saving}
                            className={`w-full text-left rounded-2xl transition-all duration-200 group ${asIsLevel === i + 1 ? "bg-[#e8f4ff] shadow-md" : "bg-white hover:shadow-sm"}`}
                            style={{
                              border: asIsLevel === i + 1 ? '2px solid #1a90ff' : '1.5px solid #dde3eb',
                            }}>
                            <div className="flex items-start gap-4 md:gap-5 px-5 md:px-7 py-5 md:py-6">
                              <div className={`flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-[15px] md:text-[17px] font-bold mt-0.5 transition-colors ${asIsLevel === i + 1 ? "text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"}`} style={asIsLevel === i + 1 ? { backgroundColor: GAPPLY_BLUE } : {}}>
                                {i + 1}
                              </div>
                              <p className={`flex-1 text-[16px] md:text-[18px] leading-relaxed pt-0.5 ${asIsLevel === i + 1 ? "text-slate-900 font-medium" : "text-slate-800"}`}>{level}</p>
                              {asIsLevel === i + 1 && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 bg-white" style={{ border: `2.5px solid ${GAPPLY_BLUE}` }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GAPPLY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                </div>
                              )}
                            </div>
                          </button>
                        ) : null
                      )}
                    </div>

                    {/* ═══ D2: Botón "No aplica a mi empresa" ═══ */}
                    <div className="flex justify-center mb-16">
                      <button
                        onClick={handleNotApplicable}
                        disabled={saving}
                        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[15px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30"
                        style={{ border: '1.5px solid #dde3eb' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                        No aplica a mi empresa
                      </button>
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="px-6 md:px-7 py-3.5 rounded-2xl text-slate-700 text-[15px] md:text-[16px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" style={{ border: '1.5px solid #dde3eb' }}>← Anterior</button>
                    <div className="text-[15px] md:text-[17px] text-slate-700 font-semibold font-[family-name:var(--font-space-mono)]">{totalAnswered} de {questions.length} <span className="text-slate-500 font-normal font-[family-name:var(--font-dm-sans)]">respondidas</span></div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* ═══ D2: canAdvance en vez de !asIsLevel ═══ */}
                    <button onClick={handleNext} disabled={!canAdvance} className="flex-1 sm:flex-none px-6 md:px-7 py-3.5 rounded-2xl text-white text-[15px] md:text-[16px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg" style={{ backgroundColor: GAPPLY_BLUE }}>
                      {currentIndex === questions.length - 1 ? "Finalizar" : "Siguiente →"}
                    </button>
                    {totalAnswered === questions.length && (
                      <button onClick={() => router.push(`/dts/resultados/${assessmentId}`)} className="flex-1 sm:flex-none px-6 md:px-7 py-3.5 rounded-2xl bg-emerald-600 text-white text-[15px] md:text-[16px] font-bold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg">Ver resultados →</button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ═══ FLOATING — continue later ═══ */}
      <div className="fixed bottom-8 right-8 z-50 hidden md:flex flex-col items-end gap-3">
        {!showCompletion && totalAnswered > 0 && totalAnswered < questions.length && (
          <button onClick={handleCopyLink} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-700 text-[14px] font-semibold shadow-md hover:shadow-lg transition-all" style={{ border: '1.5px solid #dde3eb' }}>
            {linkCopied ? (
              <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="text-emerald-600">Enlace copiado</span></>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Continuar después</>
            )}
          </button>
        )}
      </div>

      <FloatingAvatar />
    </div>
  );
}
