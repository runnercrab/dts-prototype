// src/app/api/dts/results/program-actions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function parseBool(v: string | null, defaultValue: boolean) {
  if (v === null || v === undefined || v === "") return defaultValue;
  const s = v.toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return defaultValue;
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toInt(v: any, fallback = 0) {
  return Math.round(toNum(v, fallback));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const programIdRaw = searchParams.get("programId") || "";

  const assessmentId = normalizeUuid(assessmentIdRaw);
  const programId = normalizeUuid(programIdRaw);

  const onlyShortlist = parseBool(searchParams.get("onlyShortlist"), false);
  const useOverrides = parseBool(searchParams.get("useOverrides"), true);

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  if (!programId || !isUuid(programId)) {
    return NextResponse.json(
      {
        error: "programId inválido (UUID requerido)",
        received: programIdRaw,
        normalized: programId,
      },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // opcional: validar assessment existe
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return NextResponse.json(
      { error: "Assessment no encontrado", details: aErr?.message ?? null },
      { status: 404 }
    );
  }

  // RPC
  const { data, error } = await supabase.rpc("dts_results_program_actions_v1", {
    p_assessment_id: assessmentId,
    p_program_id: programId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api program-actions] rpc error:", error);
    return NextResponse.json(
      { error: "Error ejecutando ranking de acciones", details: error.message },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];

  // Normalización de tipos (NUMERIC de Postgres a number)
  const items = rows.map((r: any) => ({
    rank: toInt(r.rank),
    action_id: r.action_id,
    action_code: r.action_code,
    title: r.title,
    description: r.description ?? null,
    status: r.status ?? null,
    impact_score: toInt(r.impact_score),
    effort_score: toInt(r.effort_score),
    weighted_need: toNum(r.weighted_need),
    value_score: toNum(r.value_score),
    action_score: toNum(r.action_score),
    criteria_covered: toInt(r.criteria_covered),
    notes: r.notes ?? null,
    owner: r.owner ?? null,
    priority_badge: r.priority_badge,
    priority_reason: r.priority_reason,
    top_contributors: Array.isArray(r.top_contributors) ? r.top_contributors : (r.top_contributors ?? []),
    top_contributors_need: toNum(r.top_contributors_need),
    top_contributors_share: toNum(r.top_contributors_share),
    top_contributors_count: toInt(r.top_contributors_count),
  }));

  const thresholds = { top: 5, mid_end: 12 };

  return NextResponse.json({
    assessment_id: assessmentId,
    program_id: programId,
    pack: assessment.pack,
    thresholds,
    count: items.length,
    items,
  });
}
