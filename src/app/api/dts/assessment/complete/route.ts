import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseService();
    const body = await req.json().catch(() => ({}));
    const assessmentId = String(body?.assessmentId || "").trim();

    if (!isUuid(assessmentId)) {
      return NextResponse.json({ ok: false, error: "assessmentId inválido" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Opcional: verificar que existe (y devolver 404 si no)
    const { data: existing, error: eErr } = await supabase
      .from("dts_assessments")
      .select("id, status")
      .eq("id", assessmentId)
      .single();

    if (eErr || !existing?.id) {
      return NextResponse.json({ ok: false, error: "Assessment no encontrado" }, { status: 404 });
    }

    const { error } = await supabase
      .from("dts_assessments")
      .update({
        status: "completed",
        phase_2_completed: true,     // ajusta si tu “complete” significa otra fase
        current_phase: 99,           // usa un “final” consistente (o 3)
        completed_at: now,
        updated_at: now,
      })
      .eq("id", assessmentId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assessmentId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
