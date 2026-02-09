// src/app/api/dts/execution/program-results/route.ts
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
  const requestId = `program_results_${Date.now()}`;

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

    // 1️⃣ Leer programa
    const { data: pi, error: piErr } = await supabase
      .from("dts_program_instances")
      .select(
        "id,assessment_id,program_id,title,status,wave,created_at,closed_at,metrics_json"
      )
      .eq("id", program_instance_id)
      .single();

    if (piErr || !pi) {
      return NextResponse.json(
        { ok: false, error: "Programa no encontrado", requestId },
        { status: 404 }
      );
    }

    // 2️⃣ Leer acciones
    const { data: actions, error: aErr } = await supabase
      .from("dts_action_instances")
      .select("action_id,title,status,position")
      .eq("program_instance_id", program_instance_id)
      .order("position", { ascending: true });

    if (aErr) {
      return NextResponse.json(
        { ok: false, error: "Error leyendo acciones", details: aErr.message, requestId },
        { status: 500 }
      );
    }

    const total = actions.length;
    let done = 0;
    let doing = 0;
    let todo = 0;

    for (const a of actions) {
      if (a.status === "done") done++;
      else if (a.status === "doing") doing++;
      else todo++;
    }

    const completion_pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const started_pct = total > 0 ? Math.round(((done + doing) / total) * 100) : 0;

    // 3️⃣ Payload ejecutivo
    return NextResponse.json({
      ok: true,
      requestId,

      program: {
        program_instance_id: pi.id,
        assessment_id: pi.assessment_id,
        program_id: pi.program_id,
        title: pi.title,
        status: pi.status,
        wave: pi.wave,
        created_at: pi.created_at,
        closed_at: pi.closed_at ?? null,
      },

      execution_metrics: {
        total_actions: total,
        todo,
        doing,
        done,
        started_pct,
        completion_pct,
      },

      actions: actions.map((a) => ({
        action_id: a.action_id,
        title: a.title,
        status: a.status,
        position: a.position,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Error generando resultados del programa",
        details: e?.message ?? String(e),
        requestId,
      },
      { status: 500 }
    );
  }
}
