// src/app/api/dts/assessment/create/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Default explícito para demo
const DEFAULT_PACK = "tmf_mvp12_v2";

// ✅ Política de funnel: packs permitidos para crear desde Home (demo)
const ALLOWED_CREATE_PACKS = new Set([
  "tmf_mvp12_v2",
  // añade aquí "tmf_full_v1" etc si procede
]);

function json(status: number, payload: any) {
  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  const requestId = `create_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    const supabase = supabaseService();
    const body = await req.json().catch(() => ({}));
    const packReceived = typeof body?.pack === "string" ? body.pack.trim() : "";

    // 1) Resolver pack (si no viene -> default explícito)
    const pack = packReceived || DEFAULT_PACK;

    // ✅ 1.1) Guardrail: no permitir crear packs legacy/inesperados desde Home
    if (!ALLOWED_CREATE_PACKS.has(pack)) {
      return json(400, {
        ok: false,
        requestId,
        error: `pack no permitido para creación: ${pack}`,
        packReceived: packReceived || null,
        packUsed: pack,
        allowed_create_packs: Array.from(ALLOWED_CREATE_PACKS),
        hint:
          "Este endpoint es para crear assessments nuevos (funnel Home). Si necesitas packs legacy, usa un endpoint/admin separado.",
      });
    }

    // 2) Validar pack contra dts_packs (fuente de verdad)
    const { data: packRow, error: pErr } = await supabase
      .from("dts_packs")
      .select("id")
      .eq("id", pack)
      .single();

    if (pErr || !packRow?.id) {
      const { data: allowed } = await supabase
        .from("dts_packs")
        .select("id")
        .order("id", { ascending: true })
        .limit(50);

      return json(400, {
        ok: false,
        requestId,
        error: `pack inválido: ${pack}`,
        packReceived: packReceived || null,
        packUsed: pack,
        allowed_packs: (allowed || []).map((r: any) => r.id),
        hint: "Crea el pack en dts_packs antes de usarlo (id debe existir).",
      });
    }

    const now = new Date().toISOString();

    console.log("✅ [assessment/create]", {
      requestId,
      packReceived: packReceived || null,
      packUsed: pack,
    });

    const insertPayload = {
      pack,
      status: "draft",
      current_phase: 0,
      phase_0_completed: false,
      started_at: now,
      created_at: now,
      updated_at: now,
      is_demo: false,
    };

    const { data, error } = await supabase
      .from("dts_assessments")
      .insert(insertPayload)
      .select("id, pack, status, current_phase, created_at")
      .single();

    if (error) {
      return json(500, {
        ok: false,
        requestId,
        error: error.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        packReceived: packReceived || null,
        packUsed: pack,
        attemptedPayload: insertPayload,
      });
    }

    return json(200, {
      ok: true,
      requestId,
      assessmentId: data.id,
      pack: data.pack,
      status: data.status,
      current_phase: data.current_phase,
      created_at: data.created_at,
    });
  } catch (err: any) {
    return json(500, {
      ok: false,
      requestId,
      error: err?.message || "Unknown error",
      hint: "Unhandled server error in assessment/create",
    });
  }
}
