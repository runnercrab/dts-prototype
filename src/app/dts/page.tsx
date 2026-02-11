"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DtsSidebar from "@/components/dts/DtsSidebar";

const GAPPLY_BLUE = "#1a90ff";

export default function DtsHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dts/create-assessment", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.assessmentId) throw new Error(json.error || "No assessmentId");
      localStorage.setItem("dts_assessment_id", json.assessmentId);
      router.push(`/dts/onboarding/${json.assessmentId}`);
    } catch (e: any) {
      setError(e.message || "Error al crear diagnóstico");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DtsSidebar currentPhase={0} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* ═══ HEADER ═══ */}
        <div className="bg-white px-6 md:px-8 py-3 flex items-center justify-between">
          <span className="text-[13px] text-slate-400">Gapply · <span className="text-slate-600 font-medium">Diagnóstico de Madurez Digital</span></span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        <main className="flex-1 pb-16">

          {/* ══════════════════════════════════════ */}
          {/* ── HERO                              ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16 bg-white border-b border-slate-200">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <p className="text-[18px] md:text-[22px] font-semibold mb-4" style={{ color: GAPPLY_BLUE }}>
                  La transformación digital no tiene que ser un laberinto.
                </p>
                <h1 className="text-[32px] md:text-[40px] lg:text-[46px] font-bold text-slate-900 leading-[1.1] mb-5">
                  Necesitas claridad para decidir.
                </h1>
                <p className="text-[17px] md:text-[20px] text-slate-600 leading-relaxed mb-8">
                  Gapply analiza tu empresa y te dice qué cambiar, en qué orden y con qué impacto.
                </p>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="px-8 md:px-10 py-4 text-white rounded-xl text-[16px] md:text-[17px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.25)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando diagnóstico...
                    </span>
                  ) : (
                    "Hacer el diagnóstico gratis →"
                  )}
                </button>
                {error && <div className="mt-3 text-[14px] text-red-500">{error}</div>}
              </div>

              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xl" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src="https://drive.google.com/file/d/1ULLdAeUSFMf5f5A6KyKFTfXMC863xbHt/preview"
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── CÓMO FUNCIONA                     ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900">Así funciona Gapply</h2>
              </div>

              <div className="space-y-10 md:space-y-12">
                {[
                  { n: 1, title: "Diagnosticamos tu empresa", body: "Analizamos cómo decides, cómo operas y cómo evolucionas. Identificamos lo que hoy está limitando tu crecimiento." },
                  { n: 2, title: "Te damos un plan para mejorar", body: "Iniciativas con acciones concretas, ordenadas por impacto, esfuerzo y urgencia. Con seguimiento real." },
                  { n: 3, title: "Anticipas lo que viene", body: "Te comparas con empresas de tu sector y tamaño. Detectas riesgos antes de que te cuesten dinero." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-5 md:gap-7">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: GAPPLY_BLUE, backgroundColor: '#f0f7ff' }}>
                      <span className="text-[16px] md:text-[18px] font-bold" style={{ color: GAPPLY_BLUE }}>{step.n}</span>
                    </div>
                    <div>
                      <h3 className="text-[17px] md:text-[20px] font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-[15px] md:text-[17px] text-slate-600 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── AVATAR / ASISTENTE                ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 bg-white">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#e8f4ff' }}>
                <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" viewBox="0 0 24 24" stroke={GAPPLY_BLUE} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-4">Un asistente que habla tu idioma</h2>
              <p className="text-[17px] md:text-[20px] text-slate-600 leading-relaxed">
                No es un formulario. Es una conversación.<br />
                Te guía, te pregunta y te ayuda a entender tu empresa sin jerga ni tecnicismos.<br />
                Disponible 24/7.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── 6 ÁREAS                           ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8 md:mb-10">
                <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-3">Las 6 áreas que analizamos</h2>
                <p className="text-[15px] md:text-[16px] text-slate-500">Determinan cómo decides y cómo creces.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {[
                  { icon: "/icons/target.png", name: "Estrategia", desc: "Si tienes foco real o todo compite." },
                  { icon: "/icons/database.png", name: "Datos", desc: "Si decides con información o intuición." },
                  { icon: "/icons/gears.png", name: "Operaciones", desc: "Si tu empresa escala con orden o con tensión." },
                  { icon: "/icons/users.png", name: "Personas", desc: "Si está claro quién decide qué." },
                  { icon: "/icons/chip.png", name: "Tecnología", desc: "Si tus sistemas ayudan o estorban." },
                  { icon: "/icons/handshake.png", name: "Gobierno y control", desc: "Si detectas riesgos antes de que sean caros." },
                ].map((d) => (
                  <div key={d.name} className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={d.icon} alt="" className="w-12 h-12 md:w-14 md:h-14 shrink-0 opacity-60" />
                      <h3 className="text-[19px] md:text-[22px] font-bold text-slate-800">{d.name}</h3>
                    </div>
                    <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed">{d.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[15px] md:text-[16px] text-slate-500 text-center mt-8">
                Cuando estas áreas están alineadas, crecer deja de ser improvisar.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── CREDIBILIDAD — logos + una línea   ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 bg-white border-y border-slate-200">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10 md:mb-14">
                <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-4">Construido sobre estándares de referencia mundial</h2>
                <p className="text-[16px] md:text-[18px] text-slate-500 leading-relaxed max-w-2xl mx-auto">Gapply no inventa metodologías. Utiliza los mismos estándares que usan las grandes consultoras, adaptados para que sean accesibles a cualquier PyME.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                <div className="flex items-center gap-8 p-8 md:p-10 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <img src="/TMForum-logo.png" alt="TM Forum" className="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[20px] md:text-[22px] font-bold text-slate-800 mb-2">TM Forum Member</div>
                    <div className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">Digital Maturity Model v5.0.1 — el estándar de referencia en transformación digital, usado por más de 850 empresas en el mundo.</div>
                  </div>
                </div>
                <div className="flex items-center gap-8 p-8 md:p-10 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <img src="/MIT-logo.png" alt="MIT" className="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[20px] md:text-[22px] font-bold text-slate-800 mb-2">MIT CDO Candidate 2025-26</div>
                    <div className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed">Programa Chief Digital Officer del MIT, aplicado al contexto real de las empresas españolas.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── CTA FINAL                         ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 text-center bg-white border-t border-slate-200">
            <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-10">¿Listo para salir del laberinto?</h2>
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-10 md:px-12 py-4 text-white rounded-xl text-[17px] md:text-[18px] font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.25)' }}
            >
              {loading ? "Creando..." : "Empezar diagnóstico gratis →"}
            </button>
          </section>

          <div className="text-center py-8 text-[12px] text-slate-300">Gapply</div>
        </main>
      </div>
    </div>
  );
}