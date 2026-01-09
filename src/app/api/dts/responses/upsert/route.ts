import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type UpsertBody = {
  assessmentId: string;
  criterionId: string;

  as_is_level?: number | null;
  to_be_level?: number | null;
  importance?: number | null;
  note?: string | null;

  // opcional: para auditoría ligera
  source?: string; // e.g. "realtimeSaver"
};

function jsonError(message: string, status = 400, detail?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, detail: detail ?? null },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<UpsertBody>;

    const assessmentId = body.assessmentId?.trim();
    const criterionId = body.criterionId?.trim();

    if (!assessmentId) return jsonError("Missing assessmentId", 400);
    if (!criterionId) return jsonError("Missing criterionId", 400);

    const url =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return jsonError(
        "Missing env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY",
        500
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Validación mínima: assessment existe (evita basura/abuso)
    const { data: assessment, error: aErr } = await supabase
      .from("dts_assessments")
      .select("id")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aErr) {
      return jsonError("Failed to validate assessment", 500, aErr.message);
    }
    if (!assessment) {
      return jsonError("Assessment not found", 404);
    }

    // Construimos payload (campos opcionales)
    const payload: Record<string, unknown> = {
      assessment_id: assessmentId,
      criterion_id: criterionId,
      as_is_level: body.as_is_level ?? null,
      to_be_level: body.to_be_level ?? null,
      importance: body.importance ?? null,
      note: body.note ?? null,
      updated_at: new Date().toISOString(),
    };

    // Requiere que exista un UNIQUE o PK compuesto en (assessment_id, criterion_id)
    const { error } = await supabase
      .from("dts_responses")
      .upsert(payload, { onConflict: "assessment_id,criterion_id" });

    if (error) {
      return jsonError("Failed to upsert dts_responses", 500, error.message);
    }

    // (Opcional) auditoría mínima server-side si algún día quieres
    // OJO: NO guardes JWTs.
    // await supabase.from("dts_logs").insert({ ... })

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return jsonError("Unexpected error", 500, e?.message);
  }
}
