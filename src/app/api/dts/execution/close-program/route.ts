// src/app/api/dts/execution/close-program/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const requestId = `close_${Date.now()}`;

  try {
    const body = await req.json();
    const { program_instance_id } = body || {};

    if (!isUuid(program_instance_id)) {
      return NextResponse.json(
        { ok: false, error: "program_instance_id inválido", requestId },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1️⃣ Leer acciones del programa
    const { data: actions, error: aErr } = await supabase
      .from("dts_action_instances")
      .select("status")
      .eq("program_instance_id", program_instance_id);

    if (aErr) throw new Error("Error leyendo acciones");

    const total = actions.length;
    let done = 0;
    let doing = 0;
    let todo = 0;

    for (const a of actions) {
      if (a.status === "done") done++;
      else if (a.status === "doing") doing++;
      else todo++;
    }

    const completion_pct =
      total > 0 ? Math.round((done / total) * 100) : 0;
    const started_pct =
      total > 0 ? Math.round(((done + doing) / total) * 100) : 0;

    const closed_at = new Date().toISOString();

    const metrics = {
      total_actions: total,
      done,
      doing,
      todo,
      completion_pct,
      started_pct,
      closed_at,
    };

    // 2️⃣ Cerrar programa
    const { error: updErr } = await supabase
      .from("dts_program_instances")
      .update({
        status: "completed",
        closed_at,
        metrics_json: metrics,
      })
      .eq("id", program_instance_id)
      .eq("status", "active");

    if (updErr) throw new Error("No se pudo cerrar el programa");

    return NextResponse.json({
      ok: true,
      requestId,
      program_instance_id,
      status: "completed",
      metrics,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Error cerrando programa",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
