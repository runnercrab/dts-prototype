"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import DtsSidebar from "@/components/dts/DtsSidebar";

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
  color: string;
  bg: string;
  madre: string;
  total: number;
  answered: number;
  startIndex: number;
}

/* ── dimension metadata ── */
const DIM_META: Record<string, { icon: string; color: string; bg: string }> = {
  EST: { icon: "/icons/target.png", color: "#2563eb", bg: "#dbeafe" },
  OPE: { icon: "/icons/gears.png", color: "#7c3aed", bg: "#ede9fe" },
  PER: { icon: "/icons/users.png", color: "#0891b2", bg: "#cffafe" },
  DAT: { icon: "/icons/database.png", color: "#d97706", bg: "#fef3c7" },
  TEC: { icon: "/icons/chip.png", color: "#059669", bg: "#d1fae5" },
  GOB: { icon: "/icons/handshake.png", color: "#dc2626", bg: "#fee2e2" },
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

  /* ── save + auto-advance ── */
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

  async function handleSelect(level: number) {
    setAsIsLevel(level);

    // Save immediately
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
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function goTo(index: number) {
    if (asIsLevel) await saveResponse();
    setCurrentIndex(index);
    setAsIsLevel(questions[index]?.response?.as_is_level || null);
    setShowDimIntro(false);
  }

  async function handlePrev() {
    if (currentIndex > 0) await goTo(currentIndex - 1);
  }

  /* ── computed ── */
  const current = questions[currentIndex];
  const currentDim = current ? dimCode(current.criteria_code) : "";
  const meta = DIM_META[currentDim] || { icon: "/icons/target.png", color: "#6b7280", bg: "#f1f5f9" };

  const dimensions: DimInfo[] = [];
  const dimMap = new Map<string, DimInfo>();
  questions.forEach((q, i) => {
    const dc = dimCode(q.criteria_code);
    if (!dimMap.has(dc)) {
      const dm = DIM_META[dc] || { icon: "/icons/target.png", color: "#6b7280", bg: "#f1f5f9" };
      const dim: DimInfo = {
        code: dc, name: q.dimension_name, icon: dm.icon, color: dm.color,
        bg: dm.bg, madre: q.context || "", total: 0, answered: 0, startIndex: i,
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
      <DtsSidebar currentPhase={2} />

      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* ═══════════════════════════════════════════ */}
        {/* ── DIMENSION PROGRESS BAR (TOP)          ── */}
        {/* ═══════════════════════════════════════════ */}
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="flex items-center justify-between gap-3">
            {dimensions.map((dim, idx) => {
              const isActive = dim.code === currentDim;
              const isComplete = dim.answered === dim.total;
              const dm = DIM_META[dim.code];
              return (
                <div key={dim.code} className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => goTo(dim.startIndex)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all flex-1 min-w-0 ${
                      isActive
                        ? "bg-blue-50 ring-2 ring-blue-300 shadow-sm"
                        : isComplete
                        ? "bg-emerald-50 hover:bg-emerald-100"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {isComplete ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-600 text-[18px] font-bold">✓</span>
                      </div>
                    ) : (
                      <Image src={dm.icon} alt={dim.name} width={28} height={28} className="flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`text-[14px] font-semibold truncate ${
                        isActive ? "text-blue-700" : isComplete ? "text-emerald-700" : "text-slate-500"
                      }`}>
                        {dim.name}
                      </div>
                      <div className={`text-[12px] font-bold ${
                        isActive ? "text-blue-500" : isComplete ? "text-emerald-500" : "text-slate-400"
                      }`}>
                        {dim.answered}/{dim.total}
                      </div>
                    </div>
                  </button>
                  {idx < dimensions.length - 1 && (
                    <div className={`w-6 h-[3px] rounded-full flex-shrink-0 ${
                      isComplete ? "bg-emerald-300" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ── MAIN CONTENT                          ── */}
        {/* ═══════════════════════════════════════════ */}
        <main className="flex-1 flex items-start justify-center px-10 py-12">
          <div className="w-full max-w-4xl">

            {showDimIntro && currentDimInfo ? (
              /* ─── DIMENSION INTRO ─── */
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
                  style={{ backgroundColor: meta.bg }}
                >
                  <Image src={meta.icon} alt={currentDimInfo.name} width={64} height={64} />
                </div>
                <div
                  className="text-[16px] font-extrabold uppercase tracking-[0.15em] mb-4"
                  style={{ color: meta.color }}
                >
                  {currentDimInfo.name}
                </div>
                <h1 className="text-[32px] font-bold text-slate-800 leading-snug mb-5 max-w-xl">
                  {currentDimInfo.madre}
                </h1>
                <p className="text-[18px] text-slate-600 mb-12 max-w-md leading-relaxed">
                  5 preguntas · Elige la opción que mejor describe tu situación <strong>HOY</strong>
                </p>
                <button
                  onClick={() => setShowDimIntro(false)}
                  className="px-10 py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: meta.color }}
                >
                  Empezar →
                </button>
              </div>
            ) : current ? (
              /* ─── QUESTION ─── */
              <div>

                {/* Breadcrumb + progress bar */}
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[14px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      <Image src={meta.icon} alt="" width={22} height={22} />
                      {current.dimension_name}
                    </span>
                    <span className="text-[17px] text-slate-700 font-semibold">
                      Pregunta {questionInDim} de {dimTotal}
                    </span>
                  </div>
                  {/* Dimension progress segments */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: dimTotal }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[6px] flex-1 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor:
                            i < questionInDim - 1
                              ? meta.color
                              : i === questionInDim - 1
                              ? asIsLevel ? meta.color : meta.color + "40"
                              : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Question */}
                <h1 className="text-[28px] font-bold text-slate-900 leading-snug mb-10">
                  {current.question}
                </h1>

                {/* Level options */}
                <div className="space-y-3 mb-14">
                  {current.levels.map((level, i) =>
                    level ? (
                      <button
                        key={i}
                        onClick={() => handleSelect(i + 1)}
                        disabled={saving}
                        className={`w-full text-left rounded-2xl border-2 transition-all duration-200 group ${
                          asIsLevel === i + 1
                            ? "border-blue-400 bg-blue-50 shadow-md"
                            : "border-slate-150 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-5 px-6 py-5">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-bold mt-0.5 transition-colors ${
                              asIsLevel === i + 1
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            }`}
                          >
                            {i + 1}
                          </div>
                          <p className={`flex-1 text-[17px] leading-relaxed pt-1.5 ${
                            asIsLevel === i + 1 ? "text-slate-800 font-medium" : "text-slate-700"
                          }`}>
                            {level}
                          </p>
                          {asIsLevel === i + 1 && (
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center mt-1.5">
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
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-6 py-3 rounded-xl border-2 border-blue-300 text-blue-600 text-[15px] font-semibold hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <div className="text-[16px] text-slate-600 font-semibold">
                    {totalAnswered} de {questions.length} respondidas
                  </div>
                  <button
                    onClick={() => {
                      if (currentIndex < questions.length - 1) {
                        const nextIdx = currentIndex + 1;
                        const isNewDim = dimCode(questions[nextIdx].criteria_code) !== dimCode(questions[currentIndex].criteria_code);
                        setCurrentIndex(nextIdx);
                        setAsIsLevel(questions[nextIdx]?.response?.as_is_level || null);
                        setShowDimIntro(isNewDim);
                      } else {
                        router.push(`/dts/resultados/${assessmentId}`);
                      }
                    }}
                    disabled={!asIsLevel}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ── AVATAR FAB                            ── */}
      {/* ═══════════════════════════════════════════ */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        {showAvatarTooltip && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-5 py-4 max-w-[240px] relative">
            <button
              onClick={() => setShowAvatarTooltip(false)}
              className="absolute top-2 right-3 text-slate-300 hover:text-slate-500 text-[16px]"
            >
              ×
            </button>
            <p className="text-[16px] text-slate-800 font-semibold leading-snug">
              👋 ¿Necesitas ayuda?
            </p>
            <p className="text-[14px] text-slate-500 mt-1">
              Pulsa para hablar con el asistente
            </p>
          </div>
        )}
        <button
          onClick={() => {
            setShowAvatarTooltip(false);
            alert("Avatar panel — próximamente");
          }}
          className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all flex items-center justify-center"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
        </button>
      </div>
    </div>
  );
}