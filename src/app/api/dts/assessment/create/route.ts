// src/app/api/dts/assessment/create/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, payload: any) {
  return NextResponse.json(payload, { status });
}

// ─── M3: PUERTA A CERRADA ─────────────────────────────────────────────
// Cierre de las puertas A/C CONFIRMADO (STOP-1 resuelto): servían producto
// caducado (packs legacy v22/ceo30/tmf), no servicio. La creación NUEVA de
// diagnósticos pasa por la PUERTA B (POST /api/dts/create-assessment, funnel
// data-driven is_funnel_default → gapply_v23).
// Único llamador previo (diagnostico-full) rewireado a la puerta B en el mismo PR.
// Mensaje de redirección = TEXTO PROVISIONAL — pendiente de papeleta-UI.
export async function POST() {
  const requestId = `create_closed_${Math.random().toString(16).slice(2)}`;
  return json(410, {
    ok: false,
    requestId,
    error: "puerta_cerrada",
    message:
      "La creación de diagnósticos se ha movido al nuevo flujo. [TEXTO PROVISIONAL — pendiente papeleta-UI]",
    redirect: "/dts",
  });
}
