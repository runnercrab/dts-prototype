"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";

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
  { label: "1 – 10", value: "1-10" },
  { label: "11 – 50", value: "11-50" },
  { label: "51 – 250", value: "51-250" },
  { label: "Más de 250", value: "250+" },
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

  const [step, setStep] = useState(0); // 0=context, 1=questions, 2=transition
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [size, setSize] = useState("");
  const [role, setRole] = useState("");

  async function handleFinishOnboarding() {
    setSaving(true);
    try {
      await fetch("/api/dts/save-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          onboardingData: {
            companyName: companyName || null,
            sector,
            companySize: size,
            role,
          },
        }),
      });
    } catch (e) {
      // Non-blocking — continue anyway
    }
    setStep(2);
    setSaving(false);
  }

  function goToDiagnostic() {
    router.push(`/dts/diagnostico/${assessmentId}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DtsSidebar currentPhase={1} />

      {/* HEADER */}
      <div className="fixed top-0 left-[220px] right-0 h-[56px] bg-white border-b-[3px] border-blue-500 flex items-center px-10 z-20">
        <span className="text-[15px] text-slate-500">
          Gapply · <span className="text-slate-700 font-medium">Contexto de tu empresa</span>
        </span>
        <span className="ml-auto text-[12px] text-slate-300 font-mono">{assessmentId.slice(0, 8)}</span>
      </div>

      {/* MAIN */}
      <main className="ml-[220px] mt-[56px] flex-1 px-10 lg:px-16 py-12">
        <div className="w-full">

          {/* ── STEP 0: WELCOME ── */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-3xl mx-auto">
              <h1 className="text-[40px] font-bold text-slate-900 leading-tight mb-4">
                Empezamos por lo básico
              </h1>
              <p className="text-[20px] text-slate-600 leading-relaxed mb-10">
                Esto no es un test técnico ni una auditoría. Son unas preguntas iniciales para entender tu contexto.
              </p>

              <div className="flex justify-center gap-8 mb-10 text-[15px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">⏱</span> Menos de 1 minuto
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">📌</span> Respuestas aproximadas
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">🔒</span> Sin registro
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="px-10 py-4 bg-blue-500 text-white rounded-xl text-[16px] font-semibold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
              >
                Empezar →
              </button>
            </div>
          )}

          {/* ── STEP 1: QUESTIONS ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 lg:p-16 w-full">
              <div className="text-[18px] text-blue-500 mb-8 font-semibold">Paso previo · Diagnóstico a continuación</div>

              {/* Company Name (optional) */}
              <div className="mb-8">
                <label className="block text-[17px] font-semibold text-slate-800 mb-2">
                  Nombre de tu empresa <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Acme Solutions"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[15px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
              </div>

              {/* Sector */}
              <div className="mb-8">
                <label className="block text-[17px] font-semibold text-slate-800 mb-3">
                  ¿En qué sector opera tu empresa?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SECTORS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSector(s)}
                      className={`px-4 py-3 rounded-xl text-[15px] text-left transition-colors border-2 ${
                        sector === s
                          ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-8">
                <label className="block text-[17px] font-semibold text-slate-800 mb-3">
                  ¿Cuántas personas hay en la empresa?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`px-4 py-3 rounded-xl text-[15px] text-center transition-colors border-2 ${
                        size === s.value
                          ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div className="mb-10">
                <label className="block text-[17px] font-semibold text-slate-800 mb-3">
                  ¿Cuál es tu rol?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-4 py-3 rounded-xl text-[15px] text-left transition-colors border-2 ${
                        role === r
                          ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleFinishOnboarding}
                disabled={saving || !sector || !size || !role}
                className="w-full py-4 bg-blue-500 text-white rounded-xl text-[16px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
              >
                {saving ? "Guardando..." : "Ir al diagnóstico →"}
              </button>
            </div>
          )}

          {/* ── STEP 2: TRANSITION ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-[32px] font-bold text-slate-900 leading-tight mb-4">
                Ahora vamos al diagnóstico
              </h1>
              <p className="text-[18px] text-slate-600 leading-relaxed mb-10">
                A continuación te haremos 30 preguntas sencillas para entender cómo funciona hoy tu empresa.
              </p>

              <div className="flex justify-center gap-6 mb-10 text-[15px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">⏱</span> ~5 minutos
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> Sin respuestas correctas o incorrectas
                </div>
              </div>

              <button
                onClick={goToDiagnostic}
                className="px-12 py-4 bg-blue-500 text-white rounded-xl text-[17px] font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
              >
                Empezar diagnóstico →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
