// src/app/api/dts/tracking/overview/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/**
 * GET /api/dts/tracking/overview?assessmentId=<uuid>
 *
 * Contract (JSON):
 * {
 *   ok: true,
 *   requestId: string,
 *   assessmentId: string,
 *   kpis: {
 *     programs: number,
 *     need_total: number,
 *     actions_done: number,
 *     actions_total: number,
 *     need_unlocked: number,
 *     actions_validated: number,
 *     need_unlocked_pct: number
 *   }
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = (searchParams.get("assessmentId") || "").trim();

  if (!isUuid(assessmentId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid assessmentId", assessmentId },
      { status: 400 }
    );
  }

  const requestId = `tracking_overview_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("dts_tracking_overview_v1", {
    p_assessment_id: assessmentId,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message, details: error },
      { status: 500 }
    );
  }

  // Tu RPC devuelve { ok, kpis, assessment_id } dentro de JSONB.
  const payload = data as any;
  if (!payload?.ok) {
    return NextResponse.json(
      { ok: false, requestId, error: payload?.error || "Unknown error", payload },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    requestId,
    assessmentId,
    kpis: payload.kpis,
  });
}
