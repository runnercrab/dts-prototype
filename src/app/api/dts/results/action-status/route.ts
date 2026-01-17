// src/app/api/dts/results/action-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type Payload = {
  assessment_id: string;
  action_id: string;
  status: "todo" | "in_progress" | "done" | null;
  notes?: string | null;
  owner?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Payload>;

    const assessment_id = (body.assessment_id || "").trim();
    const action_id = (body.action_id || "").trim();
    const status = body.status ?? null;

    if (!assessment_id || !isUuid(assessment_id)) {
      return NextResponse.json({ error: "assessment_id inválido (UUID requerido)" }, { status: 400 });
    }
    if (!action_id || !isUuid(action_id)) {
      return NextResponse.json({ error: "action_id inválido (UUID requerido)" }, { status: 400 });
    }

    // status permitido
    const allowed = new Set([null, "todo", "in_progress", "done"]);
    if (!allowed.has(status as any)) {
      return NextResponse.json({ error: "status inválido", allowed: [null, "todo", "in_progress", "done"] }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar assessment existe (evita basura)
    const { data: assessment, error: aErr } = await supabase
      .from("dts_assessments")
      .select("id")
      .eq("id", assessment_id)
      .single();

    if (aErr || !assessment) {
      return NextResponse.json({ error: "Assessment no encontrado", details: aErr?.message ?? null }, { status: 404 });
    }

    // Upsert en instancia
    const row = {
      assessment_id,
      action_id,
      status, // null permitido
      notes: body.notes ?? null,
      owner: body.owner ?? null,
      updated_at: new Date().toISOString(),
    };

    // IMPORTANTE: requiere UNIQUE (assessment_id, action_id) o PK equivalente en dts_assessment_actions
    const { data, error } = await supabase
      .from("dts_assessment_actions")
      .upsert(row, { onConflict: "assessment_id,action_id" })
      .select("assessment_id, action_id, status, notes, owner")
      .single();

    if (error) {
      console.error("[api action-status] upsert error:", error);
      return NextResponse.json({ error: "Error guardando estado de acción", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ error: "Payload inválido", details: e?.message ?? null }, { status: 400 });
  }
}
