"use client";
import { useState } from "react";

const GAPPLY_BLUE = "#1a90ff";

interface ClosingCTAProps {
  assessmentId: string;
  score: number;
}

export default function ClosingCTA({ assessmentId, score }: ClosingCTAProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setSending(true);
    try {
      // V1: Insert into Supabase lead capture
      const res = await fetch("/api/dts/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: assessmentId,
          email,
          name,
          type: "informe",
          score,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      // Fallback: mailto
      window.location.href = `mailto:david@gapply.io?subject=${encodeURIComponent(
        `Informe Gapply - Assessment ${assessmentId.slice(0, 8)}`
      )}&body=${encodeURIComponent(
        `Hola David,\n\nMe gustaría recibir mi informe de diagnóstico.\n\nNombre: ${name}\nEmail: ${email}\nAssessment: ${assessmentId}\nScore: ${score}/100\n\nGracias.`
      )}`;
      setSent(true);
    }
    setSending(false);
  };

  /* Calendly URL — replace with real one */
  const CALENDLY_URL = "https://calendly.com/contacto-ariasdavid/30min";

  return (
    <section
      className="rounded-2xl p-10 md:ml-[68px] mb-8 text-center"
      style={{ backgroundColor: "#f0f7ff", border: `2px solid ${GAPPLY_BLUE}22` }}
    >
      <h3 className="text-[24px] font-bold text-slate-800 mb-1">¿Y ahora qué?</h3>
      <p className="text-[15px] font-medium mb-5" style={{ color: GAPPLY_BLUE }}>
        ¿Listo para salir del laberinto?
      </p>

      {!showForm && !sent && (
        <>
          <p className="text-[16px] text-slate-600 mb-8 max-w-lg mx-auto">
            Ya tienes el diagnóstico. El siguiente paso es convertir estos obstáculos en un plan de acción concreto con plazos y responsables.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[16px] font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: GAPPLY_BLUE }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Crear plan de acción
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[16px] font-semibold border-2 text-slate-600 hover:bg-white transition-colors"
              style={{ borderColor: "#cbd5e1" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar informe
            </button>
          </div>
        </>
      )}

      {showForm && !sent && (
        <div className="max-w-md mx-auto text-left">
          <p className="text-[15px] text-slate-600 mb-5 text-center">
            Recibe tu informe completo con scores, obstáculos y recomendaciones por email.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <input
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!email || sending}
              className="flex-1 py-3.5 rounded-xl text-[16px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: GAPPLY_BLUE }}
            >
              {sending ? "Enviando..." : "Enviar informe"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-3.5 rounded-xl text-[15px] font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[12px] text-slate-400 mt-3 text-center">
            Recibirás tu informe en menos de 24 horas.
          </p>
        </div>
      )}

      {sent && (
        <div className="py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h4 className="text-[20px] font-bold text-slate-800 mb-2">¡Recibido!</h4>
          <p className="text-[15px] text-slate-600">
            Te enviaremos tu informe a <strong>{email}</strong> en menos de 24 horas.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 text-[15px] font-semibold transition-colors hover:opacity-80"
            style={{ color: GAPPLY_BLUE }}
          >
            ¿Quieres también una sesión para tu plan de acción? →
          </a>
        </div>
      )}
    </section>
  );
}