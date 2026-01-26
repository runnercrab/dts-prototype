// src/app/api/dts/results/action-status/route.ts
//
// ✅ CANÓNICO (compatibilidad legacy)
// Este endpoint existía para actualizar status en "results".
// Para evitar inconsistencias (todo vs not_started) y doble fuente,
// lo convertimos en un PROXY al comando canónico:
//   POST /api/dts/tracking/actions/status
//
// Reglas:
// - Frontend NO calcula nada.
// - Acepta assessmentId/actionId/status (camel o snake) y opcionales.
// - Normaliza status a: not_started | doing | done
// - Ejecuta RPC canónica dts_action_set_status_v1 (la misma que usa tracking).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

type CanonStatus = "not_started" | "doing" | "done";

function normalizeStatus(raw: unknown): CanonStatus {
  const v = String(raw ?? "").toLowerCase().trim();

  // legacy aliases
  if (v === "todo" || v === "not_started" || v === "notstarted" || v === "no_iniciada") return "not_started";
  if (v === "doing" || v === "in_progress" || v === "inprogress" || v === "en_curso") return "doing";
  if (v === "done" || v === "completed" || v === "complete" || v === "cerrada") return "done";

  // safe default
  return "not_started";
}

type BodyAny = Record<string, any>;

export async function POST(req: Request) {
  const requestId = `action_status_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const body = (await req.json().catch(() => null)) as BodyAny | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, requestId, error: "Body inválido (JSON requerido)" }, { status: 400 });
  }

  // Accept snake_case and camelCase
  const assessmentId = String(body.assessment_id ?? body.assessmentId ?? "").trim();
  const actionId = String(body.action_id ?? body.actionId ?? "").trim();

  const status: CanonStatus = normalizeStatus(body.status);

  // Optional enrichments (still backend-owned)
  const owner = body.owner != null ? String(body.owner).trim() : null;
  const startDate = body.start_date ?? body.startDate ?? null; // YYYY-MM-DD (string)
  const dueDate = body.due_date ?? body.dueDate ?? null;       // YYYY-MM-DD (string)
  const notes = body.notes != null ? String(body.notes).trim() : null;

  // For safety: default false here so legacy screens don't accidentally filter
  // (Tracking endpoint defaulted to true unless specified; that can hide rows and look like "reset".)
  const onlyTop = body.onlyTop === null || body.onlyTop === undefined ? false : !!body.onlyTop;

  if (!isUuid(assessmentId) || !isUuid(actionId)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Invalid assessmentId/actionId",
        details: { assessmentId, actionId },
      },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();

  // ✅ Single source of truth: RPC
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

  const payload = rpcData as any;
  if (!payload?.ok) {
    return NextResponse.json(
      { ok: false, requestId, error: payload?.error || "Status update failed", payload },
      { status: 400 }
    );
  }

  // Minimal response for repaint (frontend only pinta)
  return NextResponse.json(
    {
      ok: true,
      requestId,
      assessmentId,
      actionId,
      status,
      result: payload,
    },
    { status: 200 }
  );
}
