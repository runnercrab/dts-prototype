import { createClient } from "@supabase/supabase-js";
import { fetchRoadmapWithSummary } from "@/lib/dts/roadmap-data";

export async function getRoadmapData(assessmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing env");

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [roadmap, asmResult] = await Promise.all([
    fetchRoadmapWithSummary(sb, assessmentId),
    sb.from("dts_assessments").select("onboarding_data").eq("id", assessmentId).single(),
  ]);

  return {
    ...roadmap,
    companyName: asmResult.data?.onboarding_data?.companyName || "",
  };
}
