// src/app/api/dts/roadmap/activate-program/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const requestId = `activate_${Date.now()}`;

  try {
    const body = await req.json();
    const { assessment_id, program_id, wave = "now" } = body || {};

    if (!isUuid(assessment_id) || !isUuid(program_id)) {
      return NextResponse.json(
        { ok: false, error: "UUID inválido", requestId },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1️⃣ Cerrar programa activo previo (si existe)
    await supabase
      .from("dts_program_instances")
      .update({ status: "completed" })
      .eq("assessment_id", assessment_id)
      .eq("status", "active");

    // 2️⃣ Crear program_instance
    const { data: programInstance, error: piErr } = await supabase
      .from("dts_program_instances")
      .insert({
        assessment_id,
        program_id,
        status: "active",
        wave,
      })
      .select("id")
      .single();

    if (piErr || !programInstance?.id) {
      throw new Error("No se pudo crear program_instance");
    }

    const programInstanceId = programInstance.id;

    // 3️⃣ Leer acciones del catálogo del programa
    const { data: actions, error: aErr } = await supabase
      .from("dts_program_action_map")
      .select("action_id, sort_order")
      .eq("program_id", program_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (aErr) throw new Error("Error leyendo acciones del programa");

    // 4️⃣ Crear action_instances
    const rows = (actions || []).map((a) => ({
      program_instance_id: programInstanceId,
      action_id: a.action_id,
      status: "todo",
      position: a.sort_order,
    }));

    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("dts_action_instances")
        .insert(rows);

      if (insertErr) throw new Error("Error creando action_instances");
    }

    return NextResponse.json({
      ok: true,
      requestId,
      assessment_id,
      program_id,
      program_instance_id: programInstanceId,
      actions_created: rows.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Error activando programa",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
