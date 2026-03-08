import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const body = await req.json();
  const { assessmentId, q1_reflects, q2_missing, q3_would_pay, q3_depends_why, q4_referral } = body;
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await sb.from("dts_feedback").insert({
    assessment_id: assessmentId,
    q1_reflects,
    q2_missing: q2_missing || null,
    q3_would_pay,
    q3_depends_why: q3_depends_why || null,
    q4_referral: q4_referral || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}