// src/app/api/dts/assessment/complete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

async function safeReadJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await safeReadJson(req);
  const assessmentId = (body?.assessmentId || "").toString().trim();

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      { ok: false, error: "assessmentId inválido (UUID requerido)" },
      { status: 400 }
    );
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) return NextResponse.json({ ok: false, error: "Missing env SUPABASE_URL" }, { status: 500 });
  if (!serviceKey)
    return NextResponse.json({ ok: false, error: "Missing env SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("dts_assessment_complete_v1", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    console.error("[assessment/complete] rpc error:", error);
    return NextResponse.json(
      { ok: false, error: "Error completando assessment", details: error.message },
      { status: 500 }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.ok) {
    return NextResponse.json(
      { ok: false, error: "Assessment no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    assessmentId,
    status: row.status,
    current_phase: row.current_phase,
    phase_0_completed: row.phase_0_completed,
    phase_1_completed: row.phase_1_completed,
    completed_at: row.completed_at,
  });
}
