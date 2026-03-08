import { createClient } from "@supabase/supabase-js";

export async function getResultsData(assessmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing env");

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [rpcResult, asmResult] = await Promise.all([
    sb.rpc("dts_v1_results", { p_assessment_id: assessmentId }),
    sb.from("dts_assessments").select("onboarding_data").eq("id", assessmentId).single(),
  ]);

  if (rpcResult.error) throw new Error(rpcResult.error.message);
  if (!rpcResult.data) throw new Error("Empty payload");

  return {
    data: rpcResult.data,
    companyName: asmResult.data?.onboarding_data?.companyName || "",
  };
}
