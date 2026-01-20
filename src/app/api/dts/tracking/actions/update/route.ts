// src/app/api/dts/tracking/actions/update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type UpdateBody = {
  assessmentId: string;
  actionId: string;
  status?: string | null;
  owner?: string | null;
  startDate?: string | null; // YYYY-MM-DD
  dueDate?: string | null;   // YYYY-MM-DD
  notes?: string | null;
};

/**
 * POST /api/dts/tracking/actions/update
 *
 * Body:
 * { assessmentId, actionId, status?, owner?, startDate?, dueDate?, notes? }
 *
 * Returns:
 * {
 *   ok: true,
 *   requestId,
 *   assessmentId,
 *   actionId,
 *   result: rpc_jsonb,
 *   kpis: { ... },
 *   row?: refreshed row (scoped)
 * }
 */
export async function POST(req: Request) {
  const requestId = `tracking_update_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ ok: false, requestId, error: "Invalid JSON body" }, { status: 400 });
  }

  const assessmentId = (body.assessmentId || "").trim();
  const actionId = (body.actionId || "").trim();

  if (!isUuid(assessmentId) || !isUuid(actionId)) {
    return NextResponse.json(
      { ok: false, requestId, error: "Invalid assessmentId/actionId", assessmentId, actionId },
      { status: 400 }
    );
  }

  const status = body.status == null ? null : String(body.status).trim() || null;
  const owner = body.owner == null ? null : String(body.owner).trim() || null;
  const notes = body.notes == null ? null : String(body.notes).trim() || null;

  const startDate = body.startDate ? String(body.startDate).trim() : null;
  const dueDate = body.dueDate ? String(body.dueDate).trim() : null;

  const sb = supabaseAdmin();

  // 1) Update via RPC (source of truth)
  const { data: rpcData, error: rpcError } = await sb.rpc("dts_action_update_v1", {
    p_assessment_id: assessmentId,
    p_action_id: actionId,
    p_status: status,
    p_owner: owner,
    p_start_date: startDate,
    p_due_date: dueDate,
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
      { ok: false, requestId, error: rpcPayload?.error || "Update failed", payload: rpcPayload },
      { status: 400 }
    );
  }

  // 2) Refresh KPIs
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
    result: rpcPayload,
    kpis,
    row,
  });
}
