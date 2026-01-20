// src/app/api/dts/tracking/actions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function requestId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
  }

  // Service role: backend-only. NO lo expongas al cliente.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type TrackingActionRow = {
  rank: number;
  program_id: string;
  program_code: string;
  program_title: string;

  action_id: string;
  action_code: string;
  action_title: string;

  status: string; // not_started | in_progress | done | ...
  owner: string | null;
  start_date: string | null; // YYYY-MM-DD
  due_date: string | null; // YYYY-MM-DD

  impact_validated: boolean; // NORMALIZADO (no null)
  impact_validated_at: string | null; // ISO
  impact_validation_notes: string | null;

  is_overdue: boolean;
};

function normalizeRow(r: any): TrackingActionRow {
  return {
    rank: Number(r.rank),
    program_id: String(r.program_id),
    program_code: String(r.program_code),
    program_title: String(r.program_title),

    action_id: String(r.action_id),
    action_code: String(r.action_code),
    action_title: String(r.action_title),

    status: (r.status ?? "not_started") as string,
    owner: r.owner ?? null,
    start_date: r.start_date ?? null,
    due_date: r.due_date ?? null,

    impact_validated: Boolean(r.impact_validated), // null -> false
    impact_validated_at: r.impact_validated_at ?? null,
    impact_validation_notes: r.impact_validation_notes ?? null,

    is_overdue: Boolean(r.is_overdue),
  };
}

async function handle(params: {
  assessmentId: string;
  onlyTop?: boolean;
  limit?: number;
  offset?: number;
}) {
  const rid = requestId("tracking_actions");
  const { assessmentId } = params;

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        ok: false,
        requestId: rid,
        error: "assessmentId inválido (UUID requerido).",
        assessmentId,
      },
      { status: 400 }
    );
  }

  const onlyTop = params.onlyTop ?? true;
  const limitRaw = params.limit ?? 200;
  const offsetRaw = params.offset ?? 0;

  // límites defensivos (no UI-calc; esto es API hygiene)
  const limit = Math.max(1, Math.min(1000, Number(limitRaw) || 200));
  const offset = Math.max(0, Number(offsetRaw) || 0);

  const supabase = getSupabaseAdmin();

  // Llamada RPC (backend-driven)
  const { data, error } = await supabase.rpc("dts_tracking_actions_scoped_v1", {
    p_assessment_id: assessmentId,
    p_only_top: onlyTop,
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        requestId: rid,
        error: error.message,
        hint:
          "Revisa que exista la función dts_tracking_actions_scoped_v1(p_assessment_id uuid, p_only_top boolean).",
      },
      { status: 500 }
    );
  }

  const rowsAll = Array.isArray(data) ? data : [];
  const total = rowsAll.length;

  const page = rowsAll.slice(offset, offset + limit).map(normalizeRow);

  // Meta agregada (sin que el FE calcule nada)
  const meta = {
    total_rows: total,
    returned_rows: page.length,
    limit,
    offset,
    only_top: onlyTop,
  };

  return NextResponse.json({
    ok: true,
    requestId: rid,
    assessmentId,
    onlyTop,
    meta,
    rows: page,
  });
}

// GET /api/dts/tracking/actions?assessmentId=...&onlyTop=1&limit=200&offset=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentId = searchParams.get("assessmentId") ?? "";
  const onlyTopParam = searchParams.get("onlyTop");
  const onlyTop =
    onlyTopParam === null
      ? undefined
      : onlyTopParam === "1" || onlyTopParam === "true";

  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;

  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  return handle({ assessmentId, onlyTop, limit, offset });
}

// POST { assessmentId, onlyTop?, limit?, offset? }
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // body vacío permitido
  }

  return handle({
    assessmentId: body.assessmentId,
    onlyTop: body.onlyTop,
    limit: body.limit,
    offset: body.offset,
  });
}
