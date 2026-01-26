import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseService();

  // ✅ Todo en RPC
  const { data, error } = await supabase.rpc("dts_demo_ensure_v1");

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message, details: (error as any)?.details },
      { status: 500 }
    );
  }

  const assessmentId = data?.assessment_id;
  if (!assessmentId) {
    return NextResponse.json(
      { ok: false, error: "RPC dts_demo_ensure_v1 no devolvió assessment_id", data },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL(`/resultados/${assessmentId}?mode=demo`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
}
