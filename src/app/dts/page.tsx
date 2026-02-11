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
    <div className="min-h-screen bg-[#f7f9fb] flex">
      <DtsSidebar currentPhase={0} />

      <div className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">

        {/* ═══ HEADER ═══ */}
        <div className="bg-white px-6 md:px-8 py-3.5 flex items-center justify-between border-b" style={{ borderColor: '#dde3eb' }}>
          <span className="text-[14px] text-slate-500 font-medium">Gapply · <span className="text-slate-800 font-semibold">Diagnóstico de Madurez Digital</span></span>
        </div>
        <div className="h-[3px] w-full flex-shrink-0" style={{ backgroundColor: GAPPLY_BLUE }} />

        <main className="flex-1 pb-16">

          {/* ══════════════════════════════════════ */}
          {/* ── HERO                              ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-14 md:py-20 bg-white" style={{ borderBottom: '1.5px solid #dde3eb' }}>
            <div className="grid lg:grid-cols-2 gap-10 md:gap-14 items-center">
              <div>
                <p className="text-[19px] md:text-[22px] font-semibold mb-5" style={{ color: GAPPLY_BLUE }}>
                  La transformación digital no tiene que ser un laberinto.
                </p>
                <h1 className="text-[34px] md:text-[42px] lg:text-[48px] font-extrabold text-slate-900 leading-[1.08] mb-6 tracking-tight">
                  Necesitas claridad para decidir.
                </h1>
                <p className="text-[18px] md:text-[20px] text-slate-700 leading-relaxed mb-10">
                  Gapply analiza tu empresa y te dice qué cambiar, en qué orden y con qué impacto.
                </p>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="px-8 md:px-10 py-4 text-white rounded-2xl text-[17px] md:text-[18px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                {error && <div className="mt-3 text-[15px] text-red-500 font-medium">{error}</div>}
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
          <section className="px-6 md:px-10 lg:px-16 py-14 md:py-20">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12 md:mb-14">
                <h2 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 tracking-tight">Así funciona Gapply</h2>
              </div>

              <div className="space-y-10 md:space-y-14">
                {[
                  { n: 1, title: "Diagnosticamos tu empresa", body: "Analizamos cómo decides, cómo operas y cómo evolucionas. Identificamos lo que hoy está limitando tu crecimiento." },
                  { n: 2, title: "Te damos un plan para mejorar", body: "Iniciativas con acciones concretas, ordenadas por impacto, esfuerzo y urgencia. Con seguimiento real." },
                  { n: 3, title: "Anticipas lo que viene", body: "Te comparas con empresas de tu sector y tamaño. Detectas riesgos antes de que te cuesten dinero." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-6 md:gap-8">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ border: '2px solid #1a90ff', backgroundColor: '#e8f4ff' }}>
                      <span className="text-[17px] md:text-[19px] font-bold" style={{ color: GAPPLY_BLUE }}>{step.n}</span>
                    </div>
                    <div>
                      <h3 className="text-[19px] md:text-[22px] font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-[16px] md:text-[18px] text-slate-700 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── AVATAR / ASISTENTE                ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24 bg-white">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ backgroundColor: '#e8f4ff' }}>
                <svg className="w-12 h-12 md:w-14 md:h-14" fill="none" viewBox="0 0 24 24" stroke={GAPPLY_BLUE} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h2 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 mb-5 tracking-tight">Un asistente que habla tu idioma</h2>
              <p className="text-[18px] md:text-[20px] text-slate-700 leading-relaxed">
                No es un formulario. Es una conversación.<br />
                Te guía, te pregunta y te ayuda a entender tu empresa sin jerga ni tecnicismos.<br />
                Disponible 24/7.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── 6 ÁREAS                           ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-14 md:py-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10 md:mb-12">
                <h2 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 mb-4 tracking-tight">Las 6 áreas que analizamos</h2>
                <p className="text-[16px] md:text-[18px] text-slate-600">Determinan cómo decides y cómo creces.</p>
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
                  <div key={d.name} className="bg-white rounded-2xl p-8 md:p-10 transition-all hover:shadow-lg" style={{ border: '1.5px solid #dde3eb' }}>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={d.icon} alt="" className="w-14 h-14 md:w-16 md:h-16 shrink-0 opacity-60" />
                      <h3 className="text-[20px] md:text-[22px] font-bold text-slate-900">{d.name}</h3>
                    </div>
                    <p className="text-[17px] md:text-[18px] text-slate-700 leading-relaxed">{d.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[16px] md:text-[17px] text-slate-600 text-center mt-10">
                Cuando estas áreas están alineadas, crecer deja de ser improvisar.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── CREDIBILIDAD                      ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24 bg-white" style={{ borderTop: '1.5px solid #dde3eb', borderBottom: '1.5px solid #dde3eb' }}>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 mb-5 tracking-tight">Construido sobre estándares de referencia mundial</h2>
                <p className="text-[17px] md:text-[19px] text-slate-600 leading-relaxed max-w-2xl mx-auto">Gapply no inventa metodologías. Utiliza los mismos estándares que usan las grandes consultoras, adaptados para que sean accesibles a cualquier PyME.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
                <div className="flex items-center gap-8 p-8 md:p-10 rounded-2xl bg-[#f7f9fb]" style={{ border: '1.5px solid #dde3eb' }}>
                  <img src="/TMForum-logo.png" alt="TM Forum" className="w-28 h-28 md:w-32 md:h-32 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[20px] md:text-[22px] font-bold text-slate-900 mb-2">TM Forum Member</div>
                    <div className="text-[16px] md:text-[17px] text-slate-700 leading-relaxed">Digital Maturity Model v5.0.1 — el estándar de referencia en transformación digital, usado por más de 850 empresas en el mundo.</div>
                  </div>
                </div>
                <div className="flex items-center gap-8 p-8 md:p-10 rounded-2xl bg-[#f7f9fb]" style={{ border: '1.5px solid #dde3eb' }}>
                  <img src="/MIT-logo.png" alt="MIT" className="w-28 h-28 md:w-32 md:h-32 object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[20px] md:text-[22px] font-bold text-slate-900 mb-2">MIT CDO Candidate 2025-26</div>
                    <div className="text-[16px] md:text-[17px] text-slate-700 leading-relaxed">Programa Chief Digital Officer del MIT, aplicado al contexto real de las empresas españolas.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════ */}
          {/* ── CTA FINAL                         ── */}
          {/* ══════════════════════════════════════ */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24 text-center bg-white">
            <h2 className="text-[28px] md:text-[34px] font-extrabold text-slate-900 mb-10 tracking-tight">¿Listo para salir del laberinto?</h2>
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-10 md:px-14 py-4 text-white rounded-2xl text-[18px] md:text-[19px] font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.25)' }}
            >
              {loading ? "Creando..." : "Empezar diagnóstico gratis →"}
            </button>
          </section>

          <div className="text-center py-8 text-[13px] text-slate-400 font-medium">Gapply</div>
        </main>
      </div>
    </div>
  );
}