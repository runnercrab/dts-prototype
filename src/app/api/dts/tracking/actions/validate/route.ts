// src/app/api/dts/tracking/actions/validate/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type ValidateBody = {
  assessmentId: string;
  actionId: string;
  validated: boolean;
  validatedBy?: string | null;
  notes?: string | null;
};

/**
 * POST /api/dts/tracking/actions/validate
 *
 * Body:
 * { assessmentId, actionId, validated, validatedBy?, notes? }
 *
 * Contract (JSON) — backend returns everything needed to repaint:
 * {
 *   ok: true,
 *   requestId: string,
 *   assessmentId: string,
 *   actionId: string,
 *   validated: boolean,
 *   result: { ...rpc_jsonb },      // raw business result from RPC
 *   kpis: { ... },                 // refreshed overview KPIs
 *   row?: { ... }                  // refreshed action row (scoped) if found
 * }
 */
export async function POST(req: Request) {
  const requestId = `tracking_validate_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  let body: ValidateBody;
  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json({ ok: false, requestId, error: "Invalid JSON body" }, { status: 400 });
  }

  const assessmentId = (body.assessmentId || "").trim();
  const actionId = (body.actionId || "").trim();
  const validated = !!body.validated;

  const validatedBy = (body.validatedBy || "CEO").toString().trim() || "CEO";
  const notes = (body.notes || "").toString().trim() || null;

  if (!isUuid(assessmentId) || !isUuid(actionId)) {
    return NextResponse.json(
      { ok: false, requestId, error: "Invalid assessmentId/actionId", assessmentId, actionId },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();

  // 1) Validate impact via RPC (source of truth)
  const { data: rpcData, error: rpcError } = await sb.rpc("dts_action_validate_impact_v1", {
    p_assessment_id: assessmentId,
    p_action_id: actionId,
    p_validated: validated,
    p_validated_by: validatedBy,
    p_notes: notes,
  });

  if (rpcError) {
    return NextResponse.json(
      { ok: false, requestId, error: rpcError.message, details: rpcError },
      { status: 500 }
    );
  }

  const rpcPayload = rpcData as any;
  if (!rpcPayload?.ok) {
    return NextResponse.json(
      { ok: false, requestId, error: rpcPayload?.error || "Validation failed", payload: rpcPayload },
      { status: 400 }
    );
  }

  // 2) Refresh KPIs (overview) so FE updates header instantly
  const { data: ovData, error: ovError } = await sb.rpc("dts_tracking_overview_v1", {
    p_assessment_id: assessmentId,
  });

  if (ovError) {
    return NextResponse.json(
      { ok: false, requestId, error: ovError.message, details: ovError },
      { status: 500 }
    );
  }

  const ovPayload = ovData as any;
  const kpis = ovPayload?.ok ? ovPayload.kpis : null;

  // 3) Refresh the single row (optional but very useful for UI)
  const { data: rowsData, error: rowsError } = await sb.rpc("dts_tracking_actions_scoped_v1", {
    p_assessment_id: assessmentId,
    p_only_top: true,
  });

  let row: any = null;
  if (!rowsError && Array.isArray(rowsData)) {
    row = rowsData.find((r: any) => r.action_id === actionId) || null;
  }

  return NextResponse.json({
    ok: true,
    requestId,
    assessmentId,
    actionId,
    validated,
    result: rpcPayload,
    kpis,
    row,
  });
}
