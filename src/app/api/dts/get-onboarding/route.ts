import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb
    .from("dts_assessments")
    .select("onboarding_data")
    .eq("id", assessmentId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ onboarding_data: data?.onboarding_data || null });
}