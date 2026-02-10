"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import DtsSidebar from "@/components/dts/DtsSidebar";

const GAPPLY_BLUE = "#1a90ff";

/* ── types ── */
interface Question {
  criteria_id: string;
  criteria_code: string;
  dimension_code: string;
  dimension_name: string;
  question: string;
  context: string | null;
  display_order: number;
  levels: string[];
  response: { as_is_level: number; notes: string } | null;
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

/* ── dimension metadata — monochrome icons, Gapply blue when active ── */
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
  const [showAvatarTooltip, setShowAvatarTooltip] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  /* ── load questions ── */
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

          // Review mode: all answered → go to q1, skip intro
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

  useEffect(() => {
    const t = setTimeout(() => setShowAvatarTooltip(false), 6000);
    return () => clearTimeout(t);
  }, []);

  /* ── save response ── */
  const saveResponse = useCallback(
    async (level?: number) => {
      const lvl = level || asIsLevel;
      if (!lvl || !questions[currentIndex]) return;
      setSaving(true);
      try {
        await fetch("/api/dts/save-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId,
            criteriaCode: questions[currentIndex].criteria_code,
            asIsLevel: lvl,
          }),
        });
        setQuestions((prev) =>
          prev.map((q, i) =>
            i === currentIndex ? { ...q, response: { as_is_level: lvl, notes: "" } } : q
          )
        );
      } catch (e) {
        console.error(e);
      }
      setSaving(false);
    },
    [asIsLevel, currentIndex, questions, assessmentId]
  );

  /* ── select level ── */
  async function handleSelect(level: number) {
    setAsIsLevel(level);
    setSaving(true);
    try {
      await fetch("/api/dts/save-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          criteriaCode: questions[currentIndex].criteria_code,
          asIsLevel: level,
        }),
      });
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === currentIndex ? { ...q, response: { as_is_level: level, notes: "" } } : q
        )
      );
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 800);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  /* ── navigate ── */
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

  /* ── copy link ── */
  function handleCopyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  /* ── computed ── */
  const current = questions[currentIndex];
  const currentDim = current ? dimCode(current.criteria_code) : "";

  const dimensions: DimInfo[] = [];
  const dimMap = new Map<string, DimInfo>();
  questions.forEach((q, i) => {
    const dc = dimCode(q.criteria_code);
    if (!dimMap.has(dc)) {
      const dim: DimInfo = {
        code: dc, name: q.dimension_name, icon: DIM_ICON[dc] || "/icons/target.png",
        context: q.context || "", total: 0, answered: 0, startIndex: i,
      };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Cargando diagnóstico...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DtsSidebar currentPhase={2} assessmentId={assessmentId} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* ═══ HEADER ═══ */}
        <div className="bg-white px-6 md:px-8 py-3 flex items-center justify-between">
          <span className="text-[13px] text-slate-400">Gapply · Diagnóstico</span>
          <span className="text-[12px] font-mono text-slate-300">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        {/* ═══ DIMENSION PROGRESS BAR — monochrome ═══ */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between gap-2 md:gap-3 overflow-x-auto">
            {dimensions.map((dim, idx) => {
              const isActive = dim.code === currentDim && !showCompletion;
              const isComplete = dim.answered === dim.total;
              return (
                <div key={dim.code} className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => goTo(dim.startIndex)}
                    className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl transition-all flex-1 min-w-0 ${
                      isActive
                        ? "bg-blue-50 shadow-sm"
                        : isComplete
                        ? "bg-emerald-50 hover:bg-emerald-100"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                    style={isActive ? { outline: `2px solid ${GAPPLY_BLUE}`, outlineOffset: '-2px' } : {}}
                  >
                    {isComplete ? (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 text-[16px] md:text-[18px] font-bold">✓</span>
                      </div>
                    ) : (
                      <Image src={dim.icon} alt={dim.name} width={24} height={24}
                        className={`flex-shrink-0 ${isActive ? "opacity-100" : "opacity-40"}`} />
                    )}
                    <div className="min-w-0 flex-1 hidden sm:block">
                      <div className={`text-[13px] md:text-[14px] font-semibold truncate ${
                        isActive ? "text-slate-800" : isComplete ? "text-emerald-700" : "text-slate-400"
                      }`}>
                        {dim.name}
                      </div>
                      <div className={`text-[11px] md:text-[12px] font-bold ${
                        isActive ? "text-slate-500" : isComplete ? "text-emerald-500" : "text-slate-300"
                      }`}>
                        {dim.answered}/{dim.total}
                      </div>
                    </div>
                    {/* Mobile: just count */}
                    <span className="sm:hidden text-[12px] font-bold text-slate-400">{dim.answered}/{dim.total}</span>
                  </button>
                  {idx < dimensions.length - 1 && (
                    <div className={`w-4 md:w-6 h-[3px] rounded-full flex-shrink-0 ${
                      isComplete ? "bg-emerald-300" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 flex items-start justify-center px-5 md:px-10 py-8 md:py-12">
          <div className="w-full max-w-4xl">

            {/* ─── COMPLETION SCREEN ─── */}
            {showCompletion ? (
              <div className="flex flex-col items-center justify-center text-center py-16 md:py-20">
                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h1 className="text-[30px] md:text-[36px] font-bold text-slate-900 mb-4">
                  Diagnóstico completado
                </h1>
                <p className="text-[16px] md:text-[18px] text-slate-600 mb-3 max-w-lg leading-relaxed">
                  Has evaluado las {questions.length} áreas clave de tu empresa.
                </p>
                <p className="text-[15px] md:text-[16px] text-slate-500 mb-12 max-w-md">
                  Tu informe incluye tu nivel de madurez digital, los obstáculos que te están frenando y el primer paso concreto para avanzar.
                </p>
                <button
                  onClick={() => router.push(`/dts/resultados/${assessmentId}`)}
                  className="px-10 py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Ver mis resultados →
                </button>
              </div>

            ) : showDimIntro && currentDimInfo ? (
              /* ─── DIMENSION INTRO — monochrome ─── */
              <div className="flex flex-col items-center justify-center text-center py-16 md:py-20">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center mb-8 bg-slate-100 shadow-lg">
                  <Image src={currentDimInfo.icon} alt={currentDimInfo.name} width={56} height={56} className="md:w-[64px] md:h-[64px]" />
                </div>
                <div className="text-[14px] md:text-[16px] font-extrabold uppercase tracking-[0.15em] mb-4" style={{ color: GAPPLY_BLUE }}>
                  {currentDimInfo.name}
                </div>
                <h1 className="text-[26px] md:text-[32px] font-bold text-slate-800 leading-snug mb-5 max-w-xl">
                  {currentDimInfo.context}
                </h1>
                <p className="text-[16px] md:text-[18px] text-slate-600 mb-12 max-w-md leading-relaxed">
                  5 preguntas · Elige la opción que mejor describe tu situación <strong>HOY</strong>
                </p>
                <button
                  onClick={() => setShowDimIntro(false)}
                  className="px-10 py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Empezar →
                </button>
              </div>

            ) : current ? (
              /* ─── QUESTION ─── */
              <div>
                {/* Breadcrumb + progress */}
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[14px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600"
                    >
                      <Image src={DIM_ICON[currentDim] || "/icons/target.png"} alt="" width={22} height={22} className="opacity-60" />
                      {current.dimension_name}
                    </span>
                    <span className="text-[16px] md:text-[17px] text-slate-700 font-semibold">
                      Pregunta {questionInDim} de {dimTotal}
                    </span>
                    {savedFlash && (
                      <span className="inline-flex items-center gap-1.5 text-[14px] text-emerald-600 font-semibold animate-pulse">
                        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Guardado
                      </span>
                    )}
                  </div>
                  {/* Progress segments — Gapply blue */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: dimTotal }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[6px] flex-1 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor:
                            i < questionInDim - 1
                              ? GAPPLY_BLUE
                              : i === questionInDim - 1
                              ? asIsLevel ? GAPPLY_BLUE : GAPPLY_BLUE + "40"
                              : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Question */}
                <h1 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-snug mb-8">
                  {current.question}
                </h1>

                {/* Options label */}
                <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                  Opciones
                </p>

                {/* Level options — Gapply blue selected */}
                <div className="space-y-3 mb-14">
                  {current.levels.map((level, i) =>
                    level ? (
                      <button
                        key={i}
                        onClick={() => handleSelect(i + 1)}
                        disabled={saving}
                        className={`w-full text-left rounded-2xl border-2 transition-all duration-200 group ${
                          asIsLevel === i + 1
                            ? "border-blue-300 bg-blue-50 shadow-md"
                            : "border-slate-150 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-4 md:gap-5 px-5 md:px-6 py-4 md:py-5">
                          <div
                            className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[15px] md:text-[16px] font-bold mt-0.5 transition-colors ${
                              asIsLevel === i + 1
                                ? "text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            }`}
                            style={asIsLevel === i + 1 ? { backgroundColor: GAPPLY_BLUE } : {}}
                          >
                            {i + 1}
                          </div>
                          <p className={`flex-1 text-[15px] md:text-[17px] leading-relaxed pt-1 ${
                            asIsLevel === i + 1 ? "text-slate-800 font-medium" : "text-slate-700"
                          }`}>
                            {level}
                          </p>
                          {asIsLevel === i + 1 && (
                            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1.5" style={{ backgroundColor: GAPPLY_BLUE }}>
                              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ) : null
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-5 md:px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-[14px] md:text-[15px] font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <div className="text-[14px] md:text-[16px] text-slate-600 font-semibold">
                    {totalAnswered} de {questions.length} respondidas
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleNext}
                      disabled={!asIsLevel}
                      className="px-5 md:px-6 py-3 rounded-xl text-white text-[14px] md:text-[15px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                      style={{ backgroundColor: GAPPLY_BLUE }}
                    >
                      {currentIndex === questions.length - 1 ? "Finalizar" : "Siguiente →"}
                    </button>
                    {totalAnswered === questions.length && (
                      <button
                        onClick={() => router.push(`/dts/resultados/${assessmentId}`)}
                        className="px-5 md:px-6 py-3 rounded-xl bg-emerald-600 text-white text-[14px] md:text-[15px] font-semibold hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        Ver resultados →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ═══ FLOATING — continue later + avatar ═══ */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        {showAvatarTooltip && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-5 py-4 max-w-[240px] relative">
            <button
              onClick={() => setShowAvatarTooltip(false)}
              className="absolute top-2 right-3 text-slate-300 hover:text-slate-500 text-[16px]"
            >×</button>
            <p className="text-[16px] text-slate-800 font-semibold leading-snug">👋 ¿Necesitas ayuda?</p>
            <p className="text-[14px] text-slate-500 mt-1">Pulsa para hablar con el asistente</p>
          </div>
        )}

        {/* Continue later */}
        {!showCompletion && totalAnswered > 0 && totalAnswered < questions.length && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[13px] font-medium shadow-md hover:shadow-lg hover:border-slate-300 transition-all"
          >
            {linkCopied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-emerald-600">Enlace copiado</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Continuar después
              </>
            )}
          </button>
        )}

        {/* Avatar FAB */}
        <button
          onClick={() => { setShowAvatarTooltip(false); alert("Avatar panel — próximamente"); }}
          className="w-[60px] h-[60px] rounded-full text-white shadow-lg hover:opacity-90 transition-all flex items-center justify-center relative"
          style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.3)' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
        </button>
      </div>
    </div>
  );
}