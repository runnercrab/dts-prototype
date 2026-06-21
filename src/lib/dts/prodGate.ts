// src/lib/dts/prodGate.ts
import { NextResponse } from "next/server";

/**
 * 005 — Congelación del motor legacy (app) en producción.
 *
 * Mientras 1A esté roto, el motor legacy y sus escrituras quedan apagados
 * SOLO en producción (VERCEL_ENV === "production"). Preview/local quedan
 * intactos para desarrollar 1A.
 *
 * Esto NO toca auth/ownership/RLS (deuda estructural, entrada 27). Es la
 * mitigación mínima/reversible del síntoma de 005, coherente con el firewall
 * ya aceptado en /dts/roadmap (page.tsx).
 */
export function isProductionDtsWriteBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Guard para handlers de API de escritura legacy.
 *
 * Llamar como PRIMERA sentencia del handler, ANTES de req.json(), del cliente
 * Supabase y de cualquier rpc/select/insert/update/upsert:
 *
 *   const blocked = assertDtsWritesAllowedInThisEnvironment();
 *   if (blocked) return blocked;
 *
 * Devuelve un 403 si estamos en producción; null si se puede continuar.
 */
export function assertDtsWritesAllowedInThisEnvironment(): NextResponse | null {
  if (!isProductionDtsWriteBlocked()) return null;
  return NextResponse.json(
    {
      ok: false,
      error: "LEGACY_WRITES_DISABLED_IN_PRODUCTION",
      details:
        "El motor de ejecución legacy está deshabilitado en producción (mitigación 005). Usa el flujo /dts.",
    },
    { status: 403 }
  );
}
