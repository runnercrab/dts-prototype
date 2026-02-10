"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

        {/* ═══ CONTENT ═══ */}
        <main className="flex-1 pb-16">

          {/* ── HERO ── */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16 bg-white border-b border-slate-200">
            <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-bold text-slate-900 leading-[1.1] mb-5">
                  La transformación digital no tiene que ser un laberinto
                </h1>
                <p className="text-[18px] md:text-[22px] lg:text-[24px] text-slate-600 leading-relaxed mb-8">
                  Te decimos qué mejorar, por dónde empezar y con foco en impacto.
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
                    "Empezar diagnóstico gratis →"
                  )}
                </button>
                {error && <div className="mt-3 text-[14px] text-red-500">{error}</div>}
              </div>

              {/* Video */}
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

          {/* ── QUÉ HACE GAPPLY ── */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-3">¿Qué hace realmente Gapply?</h2>
              <p className="text-[16px] md:text-[18px] text-slate-500">El camino del diagnóstico a la acción, paso a paso.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
              {[
                { tag: "El problema", title: "Falta de dirección práctica", body: "Sabes que deberías mejorar procesos, tecnología, equipo y datos, pero nadie te ordena el camino: qué hacer primero y qué impacto tiene." },
                { tag: "Lo que hacemos", title: "Diagnóstico → frenos → decisiones", body: "Medimos tu situación real, la traducimos a frenos concretos (tiempo, dinero y foco) y lo convertimos en prioridades accionables." },
                { tag: "Cómo lo vivimos juntos", title: "Copiloto Digital", body: "Te guía con tu lenguaje, explica lo que no entiendas y te avisa cuando toca decidir o cuando algo bloquea el avance." },
              ].map((c) => (
                <div key={c.tag} className="bg-white rounded-2xl border border-slate-200 p-7 md:p-8">
                  <div className="text-[13px] font-semibold mb-3" style={{ color: GAPPLY_BLUE }}>{c.tag}</div>
                  <h3 className="text-[17px] md:text-[18px] font-bold text-slate-800 mb-3">{c.title}</h3>
                  <p className="text-[14px] md:text-[15px] text-slate-600 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── EVOLUCIÓN — monochrome with opacity steps ── */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 mb-3">Gapply no termina en el diagnóstico</h2>
              <p className="text-[16px] md:text-[18px] text-slate-600 leading-relaxed mb-12 md:mb-14">Comienza identificando los frenos que hoy están bloqueando a tu empresa. Pero está diseñado como un sistema de decisión que evoluciona en el tiempo.</p>
              <div className="grid sm:grid-cols-3 gap-5 md:gap-6 mb-10">
                {[
                  { tag: "V1 — Diagnóstico", title: "Identifica tus frenos reales", body: "Visión clara de lo que está impidiendo avanzar, sin teoría, con un primer foco de actuación.", opacity: 1 },
                  { tag: "V2 — Transformación", title: "De diagnóstico a acción", body: "Plan de acción priorizado por impacto y esfuerzo, con pasos concretos, responsables y plazos. Y seguimiento vivo para que nada se quede en el cajón.", opacity: 0.6 },
                  { tag: "V3 — Inteligencia", title: "Decide antes que tu competencia", body: "Benchmark contra empresas de tu sector y tamaño, simulaciones de escenarios y alertas predictivas antes de que los problemas lleguen.", opacity: 0.4 },
                ].map((v) => (
                  <div
                    key={v.tag}
                    className="rounded-2xl border-2 p-7 md:p-8"
                    style={{
                      borderColor: GAPPLY_BLUE,
                      backgroundColor: `rgba(26,144,255,${v.opacity * 0.05})`,
                      opacity: v.opacity === 1 ? 1 : undefined,
                    }}
                  >
                    <div
                      className="text-[13px] font-bold uppercase tracking-wider mb-4"
                      style={{ color: GAPPLY_BLUE, opacity: v.opacity }}
                    >
                      {v.tag}
                    </div>
                    <h3 className="text-[17px] md:text-[18px] font-bold text-slate-900 mb-3" style={{ opacity: v.opacity }}>{v.title}</h3>
                    <p className="text-[14px] md:text-[15px] text-slate-600 leading-relaxed" style={{ opacity: v.opacity }}>{v.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-slate-400 text-center">Cada fase se activa cuando tiene sentido. Sin saltos. Sin complejidad innecesaria.</p>
            </div>
          </section>

          {/* ── 6 DIMENSIONES ── */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 mb-3">El diagnóstico cubre 6 dimensiones del negocio</h2>
              <p className="text-[15px] md:text-[16px] text-slate-500">Cada dimensión revela dónde estás hoy y qué te frena para avanzar.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: "/icons/target.png", name: "Estrategia", desc: "Visión, objetivos y hoja de ruta" },
                { icon: "/icons/gears.png", name: "Operaciones", desc: "Procesos, eficiencia y métricas" },
                { icon: "/icons/users.png", name: "Personas y Decisiones", desc: "Talento, cultura y liderazgo" },
                { icon: "/icons/database.png", name: "Datos e Información", desc: "Calidad, gobernanza y uso de datos" },
                { icon: "/icons/chip.png", name: "Tecnología", desc: "Infraestructura, herramientas y deuda" },
                { icon: "/icons/handshake.png", name: "Gobierno y Control", desc: "Compliance, riesgos y supervisión" },
              ].map((d) => (
                <div key={d.name} className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200">
                  <img src={d.icon} alt="" className="w-9 h-9 shrink-0 mt-0.5 opacity-60" />
                  <div>
                    <div className="text-[15px] font-semibold text-slate-800">{d.name}</div>
                    <div className="text-[13px] text-slate-500 leading-snug">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CREDENCIALES ── */}
          <section className="px-6 md:px-10 lg:px-16 py-16 md:py-20 bg-white border-t border-slate-200">
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
              <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 mb-3">Construido sobre estándares de referencia mundial</h2>
              <p className="text-[15px] md:text-[16px] text-slate-500 leading-relaxed">Gapply no inventa metodologías. Utiliza los mismos frameworks que usan las grandes consultoras, adaptados para que sean accesibles a cualquier PyME.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-5 p-7 md:p-8 rounded-2xl border border-slate-200 bg-slate-50/50">
                <img src="/TMForum-logo.png" alt="TM Forum" className="w-16 h-16 md:w-20 md:h-20 object-contain shrink-0" />
                <div>
                  <div className="text-[15px] md:text-[16px] font-bold text-slate-800 mb-1">TM Forum Member</div>
                  <div className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed">Digital Maturity Model v5.0.1 — el estándar de facto en transformación digital, usado por más de 850 empresas en el mundo.</div>
                </div>
              </div>
              <div className="flex items-start gap-5 p-7 md:p-8 rounded-2xl border border-slate-200 bg-slate-50/50">
                <img src="/MIT-logo.png" alt="MIT" className="w-16 h-16 md:w-20 md:h-20 object-contain shrink-0" />
                <div>
                  <div className="text-[15px] md:text-[16px] font-bold text-slate-800 mb-1">MIT CDO Candidate 2025-26</div>
                  <div className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed">Frameworks CISR y metodología Big4 aplicados al contexto real de PyMEs españolas. Rigor académico, enfoque práctico.</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA FINAL — clean, no gradient ── */}
          <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16 text-center bg-slate-50">
            <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 mb-3">¿Listo para salir del laberinto?</h2>
            <p className="text-[16px] md:text-[17px] text-slate-600 mb-8 max-w-lg mx-auto">5 minutos. 30 preguntas. Resultados inmediatos. Sin registro.</p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-10 md:px-12 py-4 text-white rounded-xl text-[16px] md:text-[17px] font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: GAPPLY_BLUE, boxShadow: '0 4px 14px rgba(26,144,255,0.25)' }}
            >
              {loading ? "Creando..." : "Empezar diagnóstico gratis →"}
            </button>
          </section>

          <div className="text-center py-8 text-[12px] text-slate-300">Gapply · Standards-as-a-Service</div>
        </main>
      </div>
    </div>
  );
}