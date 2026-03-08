import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRoadmapWithSummary } from "@/lib/dts/roadmap-data";

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [roadmap, asmResult] = await Promise.all([
    fetchRoadmapWithSummary(sb, assessmentId),
    sb.from("dts_assessments").select("onboarding_data").eq("id", assessmentId).single(),
  ]);

  return NextResponse.json({
    ...roadmap,
    companyName: asmResult.data?.onboarding_data?.companyName || "",
  });
}