"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";
import FloatingAvatar from "@/components/dts/FloatingAvatar";

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

  const [step, setStep] = useState(0);
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
    } catch (e) {}
    setStep(2);
    setSaving(false);
  }

  function goToDiagnostic() {
    router.push(`/dts/diagnostico/${assessmentId}`);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      <DtsSidebar currentPhase={1} assessmentId={assessmentId} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* HEADER */}
        <div className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between" style={{ borderBottom: '1.5px solid #dde3eb' }}>
          <span className="text-[14px] text-slate-500 font-medium">Gapply · <span className="text-slate-800 font-semibold">Onboarding</span></span>
          <span className="text-[12px] font-[family-name:var(--font-space-mono)] text-slate-400">{assessmentId.slice(0, 8)}</span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        {/* MAIN */}
        <main className="flex-1 flex items-center justify-center px-5 md:px-10 py-14 md:py-20">
          <div className="max-w-5xl w-full">

            {/* ── STEP 0: WELCOME ── */}
            {step === 0 && (
              <div className="bg-white rounded-2xl p-10 md:p-14 text-center" style={{ border: '1.5px solid #dde3eb' }}>
                <div className="w-24 h-24 rounded-2xl mx-auto mb-10 flex items-center justify-center" style={{ backgroundColor: '#e8f4ff' }}>
                  <svg className="w-12 h-12" style={{ color: GAPPLY_BLUE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h1 className="text-[30px] md:text-[36px] font-extrabold text-slate-900 leading-tight mb-5 tracking-tight">
                  Empezamos por lo básico
                </h1>
                <p className="text-[17px] md:text-[19px] text-slate-700 leading-relaxed mb-12">
                  Esto no es un test técnico ni una auditoría. Son unas preguntas iniciales para entender tu contexto.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-12 py-4 rounded-2xl text-white text-[18px] font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Empezar →
                </button>
              </div>
            )}

            {/* ── STEP 1: FORM ── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-8 md:p-12" style={{ border: '1.5px solid #dde3eb' }}>
                <h2 className="text-[26px] md:text-[30px] font-extrabold text-slate-900 mb-2 tracking-tight">Contexto de tu empresa</h2>
                <p className="text-[16px] text-slate-600 mb-10">Esto nos ayuda a personalizar tu diagnóstico</p>

                {/* Company name (optional) */}
                <div className="mb-8">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 block font-[family-name:var(--font-space-mono)]">
                    Nombre de tu empresa <span className="text-slate-400 normal-case font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: Acme Digital"
                    className="w-full px-5 py-4 rounded-2xl text-[17px] text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors"
                    style={{ border: '1.5px solid #dde3eb' }}
                    onFocus={(e) => e.target.style.borderColor = '#1a90ff'}
                    onBlur={(e) => e.target.style.borderColor = '#dde3eb'}
                  />
                </div>

                {/* Sector */}
                <div className="mb-8">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 block font-[family-name:var(--font-space-mono)]">Sector *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSector(s)}
                        className={`text-left px-5 py-3.5 rounded-2xl text-[16px] transition-all ${
                          sector === s
                            ? "bg-[#e8f4ff] font-semibold text-slate-900"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        style={{
                          border: sector === s ? '1.5px solid #1a90ff' : '1.5px solid #dde3eb',
                        }}
                      >
                        {sector === s && <span className="mr-1 inline-flex w-5 h-5 items-center justify-center rounded-full" style={{ border: `2px solid ${GAPPLY_BLUE}` }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GAPPLY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company size */}
                <div className="mb-8">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 block font-[family-name:var(--font-space-mono)]">Tamaño de empresa *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SIZES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSize(s.value)}
                        className={`text-left px-5 py-3.5 rounded-2xl text-[16px] transition-all ${
                          size === s.value
                            ? "bg-[#e8f4ff] font-semibold text-slate-900"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        style={{
                          border: size === s.value ? '1.5px solid #1a90ff' : '1.5px solid #dde3eb',
                        }}
                      >
                        {size === s.value && <span className="mr-1 inline-flex w-5 h-5 items-center justify-center rounded-full" style={{ border: `2px solid ${GAPPLY_BLUE}` }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GAPPLY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div className="mb-12">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 block font-[family-name:var(--font-space-mono)]">Tu rol *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`text-left px-5 py-3.5 rounded-2xl text-[16px] transition-all ${
                          role === r
                            ? "bg-[#e8f4ff] font-semibold text-slate-900"
                            : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                        style={{
                          border: role === r ? '1.5px solid #1a90ff' : '1.5px solid #dde3eb',
                        }}
                      >
                        {role === r && <span className="mr-1 inline-flex w-5 h-5 items-center justify-center rounded-full" style={{ border: `2px solid ${GAPPLY_BLUE}` }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GAPPLY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleFinishOnboarding}
                  disabled={!canProceed || saving}
                  className="w-full py-4 rounded-2xl text-white text-[18px] font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  {saving ? "Guardando..." : "Continuar al diagnóstico →"}
                </button>
              </div>
            )}

            {/* ── STEP 2: TRANSITION ── */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-10 md:p-14 text-center" style={{ border: '1.5px solid #dde3eb' }}>
                <div className="w-24 h-24 rounded-full mx-auto mb-10 bg-emerald-50 flex items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h1 className="text-[30px] md:text-[36px] font-extrabold text-slate-900 leading-tight mb-5 tracking-tight">
                  Contexto guardado
                </h1>
                <p className="text-[17px] md:text-[19px] text-slate-700 leading-relaxed mb-4">
                  Ahora viene el diagnóstico: <strong>30 preguntas</strong> agrupadas en 6 dimensiones.
                </p>
                <p className="text-[16px] text-slate-600 mb-12">
                  Para cada pregunta, elige la opción que mejor describe tu situación <strong>hoy</strong>. No hay respuestas correctas.
                </p>
                <button
                  onClick={goToDiagnostic}
                  className="px-12 py-4 rounded-2xl text-white text-[18px] font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: GAPPLY_BLUE }}
                >
                  Empezar diagnóstico →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <FloatingAvatar />
    </div>
  );
}