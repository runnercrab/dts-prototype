import { createClient } from "@supabase/supabase-js";
import { resolveResultsPayload } from "@/lib/dts/snapshotResolver";

export async function getResultsData(assessmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing env");

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [resolved, asmResult] = await Promise.all([
    resolveResultsPayload(sb, assessmentId),
    sb.from("dts_assessments").select("onboarding_data").eq("id", assessmentId).single(),
  ]);

  return {
    data: resolved.data,
    companyName: asmResult.data?.onboarding_data?.companyName || "",
    fromSnapshot: resolved.fromSnapshot,
    snapshotId: "snapshotId" in resolved ? resolved.snapshotId : null,
    snapshotState: resolved.state,
  };
}
