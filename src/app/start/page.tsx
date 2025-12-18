"use client";

import { useState } from "react";
import Link from "next/link";

export default function StartPage() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    localStorage.setItem("dts_interest_email", email);
    setSaved(true);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-20 text-center">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">
          Empieza el diagnóstico de tu empresa
        </h1>

        <p className="text-lg opacity-80 mb-6">
          DTS no es un formulario ni un informe automático.
          Es un sistema guiado que analiza tu empresa, detecta bloqueos
          reales y te muestra qué mejorar, en qué orden y con qué impacto.
        </p>

        <p className="text-lg opacity-80 mb-10">
          Estamos abriendo el acceso de forma progresiva para acompañar
          bien a las primeras empresas.
        </p>

        {!saved ? (
          <div className="flex flex-col items-center gap-4">
            <input
              type="email"
              placeholder="Tu email profesional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-md px-4 py-3 rounded-md text-black"
            />

            <button
              onClick={handleSubmit}
              className="btn btn-primary text-lg px-8 py-4"
            >
              Avísame cuando pueda empezar
            </button>

            <p className="text-sm opacity-60">
              Sin spam · Solo para avisarte cuando abramos el acceso
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <p className="text-lg font-semibold">
              Perfecto 👍 Te avisaremos cuando puedas empezar.
            </p>

            <Link
              href="/diagnostico-full"
              className="btn btn-primary text-lg px-8 py-4"
            >
              Ver un ejemplo completo de diagnóstico →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
