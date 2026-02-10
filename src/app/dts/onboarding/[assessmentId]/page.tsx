"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";

const GAPPLY_BLUE = "#1a90ff";

const SECTORS = [
  "Tecnología y Software",
  "Telecomunicaciones",
  "Servicios Financieros",
  "Retail y E-commerce",
  "Industria y Manufactura",
  "Servicios Profesionales",
  "Salud",
  "Educación",
  "Otro",
];

const SIZES = [
  { label: "1 – 10 empleados", value: "1-10" },
  { label: "11 – 50 empleados", value: "11-50" },
  { label: "51 – 250 empleados", value: "51-250" },
  { label: "Más de 250 empleados", value: "250+" },
];

const ROLES = [
  "CEO / Fundador",
  "Director General",
  "Director de Tecnología (CTO)",
  "Director de Operaciones (COO)",
  "Director Financiero (CFO)",
  "Responsable de Área",
  "Otro",
];

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [step, setStep] = useState(0); // 0=welcome, 1=form, 2=transition
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [size, setSize] = useState("");
  const [role, setRole] = useState("");

  const canProceed = sector && size && role;

  async function handleFinishOnboarding() {
    setSaving(true);
    try {
      await fetch("/api/dts/save-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          onboardingData: { companyName: companyName || null, sector, companySize: size, role },
        }),
      });
    } catch (e) {
      // Non-blocking
    }
    setStep(2);
    setSaving(false);
  }

  function goToDiagnostic() {
    router.push(`/dts/diagnostico/${assessmentId}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DtsSidebar currentPhase={1} assessmentId={assessmentId} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* HEADER */}
        <div className="bg-white px-6 md:px-8 py-3 flex items-center justify-between">
          <span className="text-[13px] text-slate-400">Gapply · Onboarding</span>
          <span className="text-[12px] font-mono text-slate-300">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        {/* MAIN */}
        <main className="flex-1 flex items-center justify-center px-5 md:px-10 py-12 md:py-16">
          <div className="max-w-xl w-full">

            {/* ── STEP 0: WELCOME ── */}
            {step === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center" style={{ backgroundColor: '#e8f4ff' }}>
                  <svg className="w-10 h-10" style={{ color: GAPPLY_BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 leading-tight mb-4">
                  Empezamos por lo básico
                </h1>
                <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed mb-10">
                  Esto no es un test técnico ni una auditoría. Son unas preguntas iniciales para entender tu contexto.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-10 py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Empezar →
                </button>
              </div>
            )}

            {/* ── STEP 1: FORM ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
                <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 mb-2">Contexto de tu empresa</h2>
                <p className="text-[15px] text-slate-500 mb-10">Esto nos ayuda a personalizar tu diagnóstico</p>

                {/* Company name (optional) */}
                <div className="mb-7">
                  <label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Nombre de tu empresa <span className="text-slate-300 normal-case font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Acme Digital"
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 text-[16px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 transition-colors"
                  />
                </div>

                {/* Sector */}
                <div className="mb-7">
                  <label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Sector *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSector(s)}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-[15px] transition-all ${
                          sector === s
                            ? "border-blue-300 bg-blue-50 font-medium text-slate-800"
                            : "border-slate-150 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {sector === s && <span className="mr-2" style={{ color: GAPPLY_BLUE }}>✓</span>}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company size */}
                <div className="mb-7">
                  <label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tamaño de empresa *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSize(s.value)}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-[15px] transition-all ${
                          size === s.value
                            ? "border-blue-300 bg-blue-50 font-medium text-slate-800"
                            : "border-slate-150 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {size === s.value && <span className="mr-2" style={{ color: GAPPLY_BLUE }}>✓</span>}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div className="mb-10">
                  <label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tu rol *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`text-left px-4 py-3 rounded-xl border-2 text-[15px] transition-all ${
                          role === r
                            ? "border-blue-300 bg-blue-50 font-medium text-slate-800"
                            : "border-slate-150 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {role === r && <span className="mr-2" style={{ color: GAPPLY_BLUE }}>✓</span>}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleFinishOnboarding}
                  disabled={!canProceed || saving}
                  className="w-full py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  {saving ? "Guardando..." : "Continuar al diagnóstico →"}
                </button>
              </div>
            )}

            {/* ── STEP 2: TRANSITION ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-8 bg-emerald-50 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 leading-tight mb-4">
                  Contexto guardado
                </h1>
                <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed mb-4">
                  Ahora viene el diagnóstico: <strong>30 preguntas</strong> agrupadas en 6 dimensiones.
                </p>
                <p className="text-[15px] text-slate-500 mb-10">
                  Para cada pregunta, elige la opción que mejor describe tu situación <strong>hoy</strong>. No hay respuestas correctas.
                </p>
                <button
                  onClick={goToDiagnostic}
                  className="px-10 py-4 rounded-xl text-white text-[17px] font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Empezar diagnóstico →
                </button>
              </div>
            )}
          </div>
        </main>

        {/* FLOATING AVATAR */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.3)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </button>
        </div>
      </div>
    </div>
  );
}