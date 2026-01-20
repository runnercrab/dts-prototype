// src/app/api/dts/tracking/actions/status/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type Body = {
  assessmentId: string;
  actionId: string;

  // Status MUST be backend-valid: not_started | doing | done
  status: "not_started" | "doing" | "done";

  // Optional enrichments (still backend-owned)
  owner?: string | null;
  startDate?: string | null; // YYYY-MM-DD
  dueDate?: string | null;   // YYYY-MM-DD
  notes?: string | null;

  // keep demo strict by default
  onlyTop?: boolean | null;
};

/**
 * POST /api/dts/tracking/actions/status
 *
 * Body:
 * {
 *   assessmentId, actionId, status,
 *   owner?, startDate?, dueDate?, notes?, onlyTop?
 * }
 *
 * Contract (JSON) — backend returns everything needed to repaint:
 * {
 *   ok: true,
 *   requestId: string,
 *   assessmentId: string,
 *   actionId: string,
 *   status: "not_started" | "doing" | "done",
 *   result: { ...rpc_jsonb },
 *   kpis: { ... },        // refreshed overview KPIs
 *   row?: { ... }         // refreshed action row (scoped) if found
 * }
 */
export async function POST(req: Request) {
  const requestId = `tracking_status_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, requestId, error: "Invalid JSON body" }, { status: 400 });
  }

  const assessmentId = (body.assessmentId || "").trim();
  const actionId = (body.actionId || "").trim();
  const status = (body.status || "").trim() as Body["status"];

  const owner = body.owner ? String(body.owner).trim() : null;
  const notes = body.notes ? String(body.notes).trim() : null;

  const onlyTop = body.onlyTop === null || body.onlyTop === undefined ? true : !!body.onlyTop;

  const startDate = body.startDate ? String(body.startDate).trim() : null; // YYYY-MM-DD
  const dueDate = body.dueDate ? String(body.dueDate).trim() : null;

  if (!isUuid(assessmentId) || !isUuid(actionId)) {
    return NextResponse.json(
      { ok: false, requestId, error: "Invalid assessmentId/actionId", assessmentId, actionId },
      { status: 400 }
    );
  }

  if (!["not_started", "doing", "done"].includes(status)) {
    return NextResponse.json(
      { ok: false, requestId, error: "Invalid status", status },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();

  // 1) Set status via RPC (source of truth)
  const { data: rpcData, error: rpcError } = await sb.rpc("dts_action_set_status_v1", {
    p_assessment_id: assessmentId,
    p_action_id: actionId,
    p_status: status,
    p_owner: owner,
    p_start_date: startDate,
    p_due_date: dueDate,
    p_notes: notes,
    p_only_top: onlyTop,
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
      { ok: false, requestId, error: rpcPayload?.error || "Status update failed", payload: rpcPayload },
      { status: 400 }
    );
  }

  // 2) Refresh KPIs (overview)
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

  // 3) Refresh the single row (optional but very useful)
  const { data: rowsData, error: rowsError } = await sb.rpc("dts_tracking_actions_scoped_v1", {
    p_assessment_id: assessmentId,
    p_only_top: onlyTop,
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
    status,
    result: rpcPayload,
    kpis,
    row,
  });
}
