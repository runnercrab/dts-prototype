import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { assessmentId, criteriaCode, asIsLevel } = await req.json();

  // asIsLevel puede ser null (= "no aplica") o 1-5
  if (!assessmentId || !criteriaCode)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (asIsLevel !== null && asIsLevel !== undefined && (asIsLevel < 1 || asIsLevel > 5))
    return NextResponse.json({ error: "asIsLevel must be null or 1-5" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await sb.rpc("dts_v1_upsert_response", {
    p_assessment_id: assessmentId,
    p_criteria_code: criteriaCode,
    p_as_is_level: asIsLevel ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
