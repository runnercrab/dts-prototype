import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { assessmentId, onboardingData } = await req.json();
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await sb
    .from("dts_assessments")
    .update({
      onboarding_data: onboardingData,
      current_phase: 1,
    })
    .eq("id", assessmentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
