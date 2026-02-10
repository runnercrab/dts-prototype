import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { assessmentId } = await req.json();
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: questions, error: qErr } = await sb.rpc("dts_v1_list_questions", {
    p_assessment_id: assessmentId,
  });
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const criteriaIds = questions.map((q: any) => q.criteria_id);
  const { data: criteria, error: cErr } = await sb
    .from("dts_criteria")
    .select("id, code, context_es, level_1_description_es, level_2_description_es, level_3_description_es, level_4_description_es, level_5_description_es")
    .in("id", criteriaIds);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const { data: responses } = await sb
    .from("dts_responses")
    .select("criteria_id, as_is_level, as_is_notes")
    .eq("assessment_id", assessmentId);

  const criteriaMap = Object.fromEntries((criteria || []).map((c: any) => [c.id, c]));
  const responseMap = Object.fromEntries((responses || []).map((r: any) => [r.criteria_id, r]));

  const merged = questions.map((q: any) => {
    const c = criteriaMap[q.criteria_id] || {};
    const r = responseMap[q.criteria_id];
    return {
      criteria_id: q.criteria_id,
      criteria_code: q.criteria_code,
      dimension_code: q.dimension_code,
      dimension_name: q.dimension_name,
      question: q.question_es,
      context: q.dimension_context || c.context_es || null,
      display_order: q.display_order,
      levels: [
        c.level_1_description_es,
        c.level_2_description_es,
        c.level_3_description_es,
        c.level_4_description_es,
        c.level_5_description_es,
      ],
      response: r ? { as_is_level: r.as_is_level, notes: r.as_is_notes } : null,
    };
  });

  return NextResponse.json({ questions: merged });
}