// src/app/api/dts/execution/gate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * ✅ CANÓNICO
 * GET /api/dts/execution/gate?assessmentId=...
 *
 * - Backend decide si Ejecución está habilitada (pack-aware).
 * - Frontend SOLO pinta según gate.can_execute.
 *
 * Requiere:
 * - RPC public.dts_execution_gate_v1(p_assessment_id uuid)
 * - Env server-only: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const assessmentId = normalizeUuid(assessmentIdRaw);

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing env SUPABASE_URL" }, { status: 500 });
  }
  if (!serviceKey) {
    return NextResponse.json({ ok: false, error: "Missing env SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // RPC canónica (pack-aware)
  const { data, error } = await supabase.rpc("dts_execution_gate_v1", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    console.error("[gate] rpc error:", error);
    return NextResponse.json(
      { ok: false, error: "Error obteniendo gate", details: error.message },
      { status: 500 }
    );
  }

  const gate = Array.isArray(data) ? data?.[0] : data;

  if (!gate) {
    return NextResponse.json(
      { ok: false, error: "Gate vacío (RPC no devolvió filas)" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, gate });
}
