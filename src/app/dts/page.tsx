"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DtsSidebar from "@/components/dts/DtsSidebar";

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

      {/* SIDEBAR */}
      <DtsSidebar currentPhase={0} />

      {/* HEADER */}
      <div className="fixed top-0 left-[220px] right-0 h-[56px] bg-white border-b-[3px] border-blue-500 flex items-center px-10 z-20">
        <span className="text-[14px] text-slate-500">Gapply · <span className="text-slate-700 font-medium">Diagnóstico de Madurez Digital</span></span>
      </div>

      {/* MAIN */}
      <main className="ml-[220px] mt-[56px] flex-1 pb-24">

        {/* ══════ HERO SPLIT ══════ */}
        <section className="px-10 lg:px-16 py-16 bg-white border-b border-slate-200">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-[40px] lg:text-[48px] font-bold text-slate-900 leading-[1.1] mb-5">
                La transformación digital no tiene que ser un laberinto
              </h1>
              <p className="text-[24px] text-slate-600 leading-relaxed mb-8">
                Te decimos qué mejorar, por dónde empezar y con foco en impacto.
              </p>
              <button
                onClick={handleStart}
                disabled={loading}
                className="px-10 py-4 bg-blue-500 text-white rounded-xl text-[17px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
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

            {/* Right: Video */}
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

        {/* ══════ QUE HACE GAPPLY ══════ */}
        <section className="px-10 lg:px-16 py-16">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-bold text-slate-900 mb-3">¿Qué hace realmente Gapply?</h2>
            <p className="text-[18px] text-slate-500">El camino del diagnóstico a la acción, paso a paso.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="text-[13px] font-semibold text-blue-500 mb-3">El problema</div>
              <h3 className="text-[18px] font-bold text-slate-800 mb-3">Falta de dirección práctica</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">Sabes que deberías mejorar procesos, tecnología, equipo y datos, pero nadie te ordena el camino: qué hacer primero y qué impacto tiene.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="text-[13px] font-semibold text-blue-500 mb-3">Lo que hacemos</div>
              <h3 className="text-[18px] font-bold text-slate-800 mb-3">Diagnóstico → frenos → decisiones</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">Medimos tu situación real, la traducimos a frenos concretos (tiempo, dinero y foco) y lo convertimos en prioridades accionables.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="text-[13px] font-semibold text-blue-500 mb-3">Cómo lo vivimos juntos</div>
              <h3 className="text-[18px] font-bold text-slate-800 mb-3">Copiloto Digital</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">Te guía con tu lenguaje, explica lo que no entiendas y te avisa cuando toca decidir o cuando algo bloquea el avance.</p>
            </div>
          </div>
        </section>

        {/* ══════ EVOLUCIÓN DTS ══════ */}
        <section className="px-10 lg:px-16 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[32px] font-bold text-slate-900 mb-3">Gapply no termina en el diagnóstico</h2>
            <p className="text-[18px] text-slate-600 leading-relaxed mb-14">Comienza identificando los frenos que hoy están bloqueando a tu empresa. Pero está diseñado como un sistema de decisión que evoluciona en el tiempo.</p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              <div className="rounded-2xl border-2 border-blue-400 bg-blue-50/30 p-8">
                <div className="text-[13px] font-bold text-blue-500 uppercase tracking-wider mb-4">V1 — Diagnóstico</div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-3">Identifica tus frenos reales</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">Visión clara de lo que está impidiendo avanzar, sin teoría, con un primer foco de actuación.</p>
              </div>
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/30 p-8">
                <div className="text-[13px] font-bold text-amber-500 uppercase tracking-wider mb-4">V2 — Transformación</div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-3">De diagnóstico a acción</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">Plan de acción priorizado por impacto y esfuerzo, con pasos concretos, responsables y plazos. Y seguimiento vivo para que nada se quede en el cajón.</p>
              </div>
              <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 p-8">
                <div className="text-[13px] font-bold text-emerald-500 uppercase tracking-wider mb-4">V3 — Inteligencia</div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-3">Decide antes que tu competencia</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed">Benchmark contra empresas de tu sector y tamaño, simulaciones de escenarios y alertas predictivas antes de que los problemas lleguen.</p>
              </div>
            </div>
            <p className="text-[14px] text-slate-400 text-center">Cada fase se activa cuando tiene sentido. Sin saltos. Sin complejidad innecesaria.</p>
          </div>
        </section>

        {/* ══════ 6 DIMENSIONES ══════ */}
        <section className="px-10 lg:px-16 py-16">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-slate-900 mb-3">El diagnóstico cubre 6 dimensiones del negocio</h2>
            <p className="text-[16px] text-slate-500">Cada dimensión revela dónde estás hoy y qué te frena para avanzar.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: "/icons/target.png", name: "Estrategia", desc: "Visión, objetivos y hoja de ruta" },
              { icon: "/icons/gears.png", name: "Operaciones", desc: "Procesos, eficiencia y métricas" },
              { icon: "/icons/users.png", name: "Personas y Decisiones", desc: "Talento, cultura y liderazgo" },
              { icon: "/icons/database.png", name: "Datos e Información", desc: "Calidad, gobernanza y uso de datos" },
              { icon: "/icons/chip.png", name: "Tecnología", desc: "Infraestructura, herramientas y deuda" },
              { icon: "/icons/handshake.png", name: "Gobierno y Control", desc: "Compliance, riesgos y supervisión" },
            ].map((d) => (
              <div key={d.name} className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200">
                <img src={d.icon} alt="" className="w-9 h-9 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[15px] font-semibold text-slate-800">{d.name}</div>
                  <div className="text-[13px] text-slate-500 leading-snug">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════ CREDENCIALES ══════ */}
        <section className="px-10 lg:px-16 py-20 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-[28px] font-bold text-slate-900 mb-3">Construido sobre estándares de referencia mundial</h2>
            <p className="text-[16px] text-slate-500 leading-relaxed">Gapply no inventa metodologías. Utiliza los mismos frameworks que usan las grandes consultoras, adaptados para que sean accesibles a cualquier PyME.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-5 p-8 rounded-2xl border border-slate-200 bg-slate-50/50">
              <img src="/TMForum-logo.png" alt="TM Forum" className="w-20 h-20 object-contain shrink-0" />
              <div>
                <div className="text-[16px] font-bold text-slate-800 mb-1">TM Forum Member</div>
                <div className="text-[14px] text-slate-600 leading-relaxed">Digital Maturity Model v5.0.1 — el estándar de facto en transformación digital, usado por más de 850 empresas en el mundo.</div>
              </div>
            </div>
            <div className="flex items-start gap-5 p-8 rounded-2xl border border-slate-200 bg-slate-50/50">
              <img src="/MIT-logo.png" alt="MIT" className="w-20 h-20 object-contain shrink-0" />
              <div>
                <div className="text-[16px] font-bold text-slate-800 mb-1">MIT CDO Candidate 2025-26</div>
                <div className="text-[14px] text-slate-600 leading-relaxed">Frameworks CISR y metodología Big4 aplicados al contexto real de PyMEs españolas. Rigor académico, enfoque práctico.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════ CTA FINAL ══════ */}
        <section className="px-10 lg:px-16 py-16 text-center" style={{background:'linear-gradient(135deg, #e8f4fe, #f0fdf4)'}}>
          <h2 className="text-[28px] font-bold text-slate-900 mb-3">¿Listo para salir del laberinto?</h2>
          <p className="text-[17px] text-slate-600 mb-8 max-w-lg mx-auto">5 minutos. 30 preguntas. Resultados inmediatos. Sin registro.</p>
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-12 py-4 bg-blue-500 text-white rounded-xl text-[17px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/25"
          >
            {loading ? "Creando..." : "Empezar diagnóstico gratis →"}
          </button>
        </section>

        <div className="text-center py-8 text-[12px] text-slate-300">Gapply · Standards-as-a-Service</div>
      </main>
    </div>
  );
}